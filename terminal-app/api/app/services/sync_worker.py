
from app.db.session import SessionLocal
from sqlalchemy.orm import Session
import requests
import logging
import time
from app.core.config import settings, get_sync_config, update_last_sync_time
from app.crud.user_crud import handle_user_sync

URL = settings.CENTRAL_API_URL


def start_sync_worker():
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
                    push_attendance_to_central()

                    # DOWNLINK: (Fetch updates from central server)
                    pull_central_updates(db, terminal_id, last_sync)
            except Exception as e:
                logging.error(f"Error during sync: {e}")

        else:
            logging.info("Terminal not activated. Skipping Sync...")

        # wait for 5 minutes before next sync
        time.sleep(30)


def push_attendance_to_central():
    pass


def pull_central_updates(db: Session, terminal_id: int, last_sync: str):
    params = {
        "terminal_id": terminal_id,
        "last_sync": last_sync
    }

    try:
        response = requests.get(f"{URL}/sync/updates", params=params)

        if response.status_code == 200:
            result = response.json()
            updates = result.get("updates", [])
            # log the entire response for debugging
            logging.info(f"Received response from central server: {result}")

            # The most recent sync queue in the central server
            last_sync_time = result.get("last_sync_time")

            if not updates:
                return

            # keep track of IDs we successfully processed to acknowledge them
            successfull_sync_ids = []

            for item in updates:
                try:
                    if item["entity_type"] == 'tbl_user':
                        handle_user_sync(db, item["action"], item["data"])
                        db.commit()  # Commit each user individually to be safe

                    successfull_sync_ids.append(item["id"])
                except Exception as e:
                    continue

            # acknowledge the central server about the successfully processed updates

            logging.info(f"Applied {len(updates)} from central server")

            # update the local config file (last_sync)
            if last_sync_time:
                update_last_sync_time(last_sync_time)
    except requests.exceptions.RequestException:
        logging.warning("Downlink failed: Central Server unreachable.")
