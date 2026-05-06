import base64
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models.users import User
from app.db.models.auth_policy import AuthPolicy
from app.db.models.user_permission import UserPermission
from app.db.models.event_access_policy import EventAccessPolicy
from app.db.models.events import Event
from app.services.attendance_service import load_users_into_memory


def get_user_by_id(db: Session, id: int):
    return db.query(User).filter(User.id == id).first()


def get_user_details_by_id(db: Session, id: int, context: str = "daily"):
    """
    Returns the user details including group info
    Join with UserPermission to maintian backward compatibility 
    with existing code that expects group_id and subgroup_id in the user details.
    """
    return db.query(
        User.id,
        UserPermission.group_id,
        UserPermission.subgroup_id,
        User.fname,
        User.lname
    ).join(UserPermission, User.id == UserPermission.user_id).filter(User.id == id).filter(UserPermission.context == context).first()

# get user original face template by id (used for comparison during enrollment refinement)


def get_user_original_face_template_by_id(db: Session, id: int):
    user = db.query(User.face_template).filter(User.id == id).first()
    return user[0] if user else None

# get user refined face, fallback to original if no refined face


def get_user_face_template_by_id(db: Session, id: int):
    # coalesce(refined, original) returns refined if it's not NULL, otherwise original
    user = db.query(
        func.coalesce(User.face_template_refined, User.face_template)
    ).filter(User.id == id).first()

    return user[0] if user else None

# get user card user card


def get_user_id_by_code(db: Session, code: str):
    user = db.query(User.id).filter(User.card_serial_code == code).first()
    return user[0] if user else None


def get_user_auth_policy(db: Session, user_id: int, terminal_id: int, context: str = 'daily', event_id: int = None):
    """
    Fetches required auth types based on the user's permissions and the 
    specified context (daily/event).
    """

    # Fetch the relevant permission for this user and context
    perm_query = db.query(UserPermission).filter(
        UserPermission.user_id == user_id,
        UserPermission.context == context
    )

    if context == 'event' and event_id:
        perm_query = perm_query.filter(UserPermission.event_id == event_id)

    permission = perm_query.first()

    if not permission:
        return []

    # Determine which policy table to query based on context
    if context == 'daily':
        # Daily: Check tbl_auth_policy (Daily Terminal Rules)
        query = db.query(AuthPolicy.auth_type_name).filter(
            AuthPolicy.terminal_id == terminal_id,
            AuthPolicy.group_id == permission.group_id
        )
        if permission.subgroup_id:
            query = query.filter(AuthPolicy.subgroup_id ==
                                 permission.subgroup_id)
    else:
        # Event: Check tbl_event_access_policy (Specific Event Rules)
        # Note: Ensure you have an EventAccessPolicy model for tbl_event_access_policy
        query = db.query(EventAccessPolicy.auth_type_name).filter(
            EventAccessPolicy.event_id == event_id,
            EventAccessPolicy.group_id == permission.group_id
        )
        if permission.subgroup_id:
            query = query.filter(
                EventAccessPolicy.subgroup_id == permission.subgroup_id)

    policies = query.all()

    # Return a simple list of strings like ["face", "card"]
    return [p.auth_type_name for p in policies]


def handle_user_sync(db: Session, action: str, data: dict):
    user_id = data.get("id")
    needs_memory_refresh = False  # track if biometrics changed

    try:
        if action == "upsert":
            # 1. Sync User Core Data (The Identitiy)
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                user = User(id=user_id)
                db.add(user)
                needs_memory_refresh = True  # new user with biometrics will require memory refresh

            # check if face template is actually changing
            new_face = data.get('face_template')
            if new_face:
                decoded_face = base64.b64decode(new_face)
                if user.face_template != decoded_face:
                    user.face_template = decoded_face
                    needs_memory_refresh = True

            user.fname = data.get("fname")
            user.lname = data.get("lname")
            user.gender = data.get("gender")
            user.user_type = data.get("user_type")
            user.card_serial_code = data.get("card_serial_code")

            if data.get('face_template'):
                user.face_template = base64.b64decode(data['face_template'])
            if data.get('fingerprint_template'):
                user.fingerprint_template = base64.b64decode(
                    data['fingerprint_template'])

            # 2. Sync User Permissions (The Authorization)
            # We delete existing local perms for this user to avoid stale data
            db.query(UserPermission).filter(
                UserPermission.user_id == user_id).delete()

            permissions = data.get("permissions", [])
            for pol in permissions:
                # Assuming you have a UserPermission model linked to tbl_user_permission
                new_perm = UserPermission(
                    user_id=user_id,
                    group_id=pol.get("group_id"),
                    subgroup_id=pol.get("subgroup_id"),
                    context=pol.get("context"),  # 'daily' or 'event'
                    event_id=pol.get("event_id")
                )
                db.add(new_perm)

                logging.info(
                    "User %s and permissions synced successfully.", user_id)
                db.commit()

            # If biometrics changed, signal the attendance service to refresh its in-memory data
            if needs_memory_refresh:
                logging.info(
                    "Biometric data changed for user %s. Signaling attendance service to refresh cache.", user_id)
                load_users_into_memory()

    except Exception as e:
        db.rollback()
        logging.error("Error syncing user %s: %s", user_id, str(e))
        raise


def get_pending_users_face_templates(db: Session):
    """
    Fetches all users with pending sync status and their face templates.
    This is used by the uplink worker to know which users need to be synced to the central server.
    """

    logging.debug(
        "Fetching users with pending sync status for face template upload.")
    return db.query(User.id, User.face_template_refined).filter(User.sync_status == "pending").limit(25).all()
