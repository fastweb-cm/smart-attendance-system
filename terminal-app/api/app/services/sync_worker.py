import base64
from datetime import date

from api.app.db.models.users import User
from app.db.session import SessionLocal
from sqlalchemy.orm import Session
import requests
import logging
import time
from app.core.config import settings, get_sync_config, update_last_sync_time
from app.crud.user_crud import handle_user_sync, get_pending_users_face_templates
from app.crud.event_crud import handle_event_sync
from app.db.models.attendance_session import AttendanceSession
from app.services.summary_service import prepare_summary_batch, midnight_missed_checkout_cleanup

URL = settings.CENTRAL_API_URL

# keep track of the last time cleanup ran in memory
LAST_CLEANUP_DATE = None


def start_sync_worker():
    global LAST_CLEANUP_DATE
    logging.info("Starting the sync worker...")
    while True:
        # Get the current config
        config = get_sync_config()
        terminal_id = config["terminal_id"]
        last_sync = config["last_sync_timestamp"]

        # check if the terminal is activated
        if terminal_id > 0:
            try:
                with SessionLocal() as db:
                    # UPLINK: (Push attendance to central server)
                    current_date = date.today()
                    if LAST_CLEANUP_DATE is None or LAST_CLEANUP_DATE < current_date:
                        logging.info(
                            "Running midnight cleanup for missed checkouts...")
                        midnight_missed_checkout_cleanup(db)
                        LAST_CLEANUP_DATE = current_date

                    push_attendance_to_central()

                    push_user_templates_to_central()

                    # DOWNLINK: (Fetch updates from central server)
                    pull_central_updates(db, terminal_id, last_sync)
            except Exception as e:
                logging.error(f"Error during sync: {e}")

        else:
            logging.info("Terminal not activated. Skipping Sync...")

        # wait for 5 minutes before next sync
        time.sleep(60)


def push_attendance_to_central():
    logging.info("Checking for pending attendance to uplink...")
    with SessionLocal() as db:
        # Fetch unsynced sessions
        pending_sessions = db.query(AttendanceSession).filter(
            AttendanceSession.sync_status.in_(['pending', 'error'])
        ).limit(100).all()

        if not pending_sessions:
            return

        # Prepare the batch payload
        batch_data = []
        session_map = {}  # To keep track of objects to update status later

        for session in pending_sessions:
            batch_data.append({
                "local_id": session.id,  # Send local ID so PHP can acknowledge
                "user_id": session.user_id,
                "terminal_id": session.terminal_id,
                "context": session.attendance_context,
                "event_id": session.event_id,
                "checkin_timestamp": session.checkin_timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "checkout_timestamp": session.checkout_timestamp.strftime("%Y-%m-%d %H:%M:%S") if session.checkout_timestamp else None,
                "checkin_status": session.checkin_status,
                "checkout_status": session.checkout_status if session.checkout_status else None,
                "session_status": session.session_status,
                "sync_status": session.sync_status,
                "created_at": session.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            })
            session_map[session.id] = session

        try:
            # Send the ENTIRE array in one hit
            response = requests.post(
                f"{URL}/sync/uplink/sessions-batch",
                json={"sessions": batch_data},
                timeout=20
            )

            if response.status_code == 200:
                result = response.json()
                # Use the IDs returned by the server to mark as synced
                # This is safer than marking all, in case PHP failed on some
                synced_ids = result.get("synced_local_ids", [])

                # mark session as synced
                for s_id in synced_ids:
                    if s_id in session_map:
                        session_map[s_id].sync_status = 'synced'

                # filter sessions that are finalized to generate summaries
                finalized_sessions = [s for s in pending_sessions if s.id in synced_ids and s.session_status in [
                    'completed', 'missed checkout']]

                if finalized_sessions:
                    summary_batch = prepare_summary_batch(
                        db, finalized_sessions)

                    # push summaries immediately to central server
                    try:
                        summary_response = requests.post(
                            f"{URL}/sync/uplink/summaries-batch",
                            json={"summaries": summary_batch},
                            timeout=20
                        )
                        if summary_response.status_code == 200:
                            logging.info(
                                f"Successfully batch-synced {len(summary_batch)} summaries.")
                        else:
                            logging.error(
                                f"Batch uplink of summaries failed. Server returned: {summary_response.status_code}")
                    except Exception as e:
                        logging.error(
                            f"Failed to perform batch uplink of summaries: {e}")

                db.commit()
                logging.info(
                    f"Successfully batch-synced {len(synced_ids)} sessions.")
            else:
                logging.error(
                    f"Batch uplink failed. Server returned: {response.status_code}")

        except Exception as e:
            logging.error(f"Failed to perform batch uplink: {e}")
            db.rollback()


def pull_central_updates(db: Session, terminal_id: int, last_sync: str):
    params = {
        "terminal_id": terminal_id,
        "last_sync": last_sync
    }

    try:
        response = requests.get(f"{URL}/sync/updates", params=params)

        if response.status_code == 200:
            result = response.json()
            updates = result.get("data", [])
            # log the entire response for debugging
            # logging.info(f"Received response from central server: {result}")

            # The most recent sync queue in the central server
            last_sync_time = result.get("last_sync_time")

            if not updates:
                logging.info("No updates from central server.")
                return

            # keep track of IDs we successfully processed to acknowledge them
            successfull_sync_ids = []

            for item in updates:
                try:
                    entity_type = item.get("type")

                    if entity_type == 'tbl_event':
                        handle_event_sync(db, item["action"], item["data"])
                        db.commit()  # Commit each event individually to be safe
                    elif entity_type == 'tbl_user':
                        handle_user_sync(db, item["action"], item["data"])
                        db.commit()  # Commit each user individually to be safe

                    else:
                        logging.warning(f"Unknown entity type: {entity_type}")

                    successfull_sync_ids.append(item["id"])
                except Exception as e:
                    logging.error(
                        f"Failed to process item {item.get('id')}: {e}", exc_info=True)
                    db.rollback()  # Rollback the failed transaction
                    continue

            # acknowledge the central server about the successfully processed updates

            logging.info(f"Applied {len(updates)} from central server")

            # update the local config file (last_sync)
            if last_sync_time:
                update_last_sync_time(last_sync_time)

            # acknowledge the central server about the successfully processed updates
            if successfull_sync_ids:
                update_sync_status(successfull_sync_ids)
    except requests.exceptions.RequestException:
        logging.warning("Downlink failed: Central Server unreachable.")

# update central server about successful sync
# passing the list of successfully processed sync IDs so that central server can mark them as completed and avoid sending them again in the next sync cycle


def update_sync_status(successful_ids):
    try:
        response = requests.post(
            f"{URL}/sync/acknowledge", json={"ids": successful_ids})
        if response.status_code == 200:
            logging.info(
                "Successfully acknowledged sync updates to central server.")
        else:
            logging.warning(
                f"Failed to acknowledge sync updates. Status code: {response.status_code}")
    except requests.exceptions.RequestException:
        logging.warning(
            "Failed to acknowledge sync updates: Central Server unreachable.")


def push_user_templates_to_central():
    logging.info("Checking for pending user face templates to uplink...")
    with SessionLocal() as db:
        pending_users = get_pending_users_face_templates(db)

        if not pending_users:
            return

        payload = []
        for user_id, face_template in pending_users:
            payload.append({
                "user_id": user_id,
                "face_template": base64.b64encode(face_template).decode('utf-8') if face_template else None,
            })

        if not payload:
            return

        try:
            response = requests.post(
                f"{URL}/sync/uplink/user-templates",
                json={"users": payload}
            )

            if response.status_code == 200:
                result = response.json()
                synced_user_ids = result.get("synced_user_ids", [])

                # mark users as synced
                for u_id in synced_user_ids:
                    user_record = db.query(User).filter(
                        User.id == u_id).first()
                    if user_record:
                        user_record.sync_status = 'synced'
                db.commit()

                logging.info(
                    f"Successfully batch-synced {len(synced_user_ids)} user templates.")
            else:
                logging.error(
                    f"Batch uplink of user templates failed. Server returned: {response.status_code}")
        except Exception as e:
            logging.error(
                f"Failed to perform batch uplink of user templates: {e}")
            db.rollback()
