from sqlalchemy.orm import Session
import logging
from app.db.models.events import Event
from app.db.models.event_access_policy import EventAccessPolicy
from app.db.models.event_checkin_checkout_range import EventCheckinCheckoutRange


def handle_event_sync(db: Session, action: str, event_data: dict):
    """
    Handles the synchronization of event data from the central server.
    This includes creating/updating events and their associated access policies.
    """
    event_id = event_data.get("id")
    name = event_data.get("name")
    start_time = event_data.get("start_datetime")
    end_time = event_data.get("end_datetime")
    affects_attendance = event_data.get("affects_attendance", 0)
    created_by = event_data.get("created_by")
    handshake = event_data.get("handshake")
    created_at = event_data.get("created_at")
    updated_at = event_data.get("updated_at")
    access_policies = event_data.get("access_policies", [])

    try:
        if action == "upsert":
            # Upsert the event
            event = db.query(Event).filter(Event.id == event_id).first()
            if not event:
                event = Event(id=event_id)
                db.add(event)

            event.name = name
            event.start_datetime = start_time
            event.end_datetime = end_time
            event.affects_attendance = affects_attendance
            event.created_by = created_by
            event.handshake = handshake
            event.created_at = created_at
            event.updated_at = updated_at

            # Upsert access policies
            for policy in access_policies:
                policy_id = policy.get("id")
                group_id = policy.get("group_id")
                subgroup_id = policy.get("subgroup_id")
                auth_type_id = policy.get("auth_type_id")
                auth_type_name = policy.get("auth_type_name")

                access_policy = db.query(EventAccessPolicy).filter(
                    EventAccessPolicy.id == policy_id).first()
                if not access_policy:
                    access_policy = EventAccessPolicy(
                        id=policy_id, event_id=event_id)
                    db.add(access_policy)

                access_policy.group_id = group_id
                access_policy.subgroup_id = subgroup_id
                access_policy.auth_type_id = auth_type_id
                access_policy.auth_type_name = auth_type_name

            # Upsert checkin/checkout ranges
            range_info = event_data.get("checkinout_range")
            if range_info and isinstance(range_info, dict):
                range_id = range_info.get("id")
                checkin_start_datetime = range_info.get(
                    "checkin_start_datetime")
                checkin_end_datetime = range_info.get("checkin_end_datetime")
                checkout_start_datetime = range_info.get(
                    "checkout_start_datetime")
                checkout_end_datetime = range_info.get("checkout_end_datetime")

                range_entry = db.query(EventCheckinCheckoutRange).filter(
                    EventCheckinCheckoutRange.id == range_id).first()
                if not range_entry:
                    range_entry = EventCheckinCheckoutRange(
                        id=range_id, event_id=event_id)
                    db.add(range_entry)

                range_entry.checkin_start_datetime = checkin_start_datetime
                range_entry.checkin_end_datetime = checkin_end_datetime
                range_entry.checkout_start_datetime = checkout_start_datetime
                range_entry.checkout_end_datetime = checkout_end_datetime

            logging.info(
                f"Check-in/Checkout range updated for event {event_id}: {range_id}")

        elif action == "delete":
            # Delete the event
            event = db.query(Event).filter(Event.id == event_id).first()
            if event:
                db.delete(event)
            logging.info(f"Event {event_id} deleted successfully.")

    except Exception as e:
        logging.error(f"Error occurred while handling event sync: {e}")
        db.rollback()
        raise e
