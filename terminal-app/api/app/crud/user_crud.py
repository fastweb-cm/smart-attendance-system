import base64
import logging
from sqlalchemy.orm import Session
from app.db.models.users import User
from app.db.models.auth_policy import AuthPolicy


def get_user_by_id(db: Session, id: int):
    return db.query(User).filter(User.id == id).first()


def get_user_details_by_id(db: Session, id: int):
    return db.query(User.id, User.group_id, User.subgroup_id, User.fname, User.lname).filter(User.id == id).first()


# get user face embedding template by user id
def get_user_face_template_by_id(db: Session, id: int):
    user = db.query(User.face_template).filter(User.id == id).first()
    return user[0] if user else None


def get_user_auth_policy(db: Session, user_id: int, terminal_id: int):
    """
    Fetches the list of required auth types for a user based on their 
    group_id and subgroup_id at a specific terminal.
    """

    # get the user's group info
    user = db.query(User.group_id, User.subgroup_id).filter(
        User.id == user_id).first()
    if not user:
        return []

    # query the policy table to get the required auth types for this group at the terminal
    query = db.query(AuthPolicy.auth_type_name).filter(
        AuthPolicy.terminal_id == terminal_id,
        AuthPolicy.group_id == user.group_id
    )

    # if subgroup_id is not null, we further filter by subgroup_id
    if user.subgroup_id:
        query = query.filter(AuthPolicy.subgroup_id == user.subgroup_id)

    policies = query.all()
    # return a simple list of strings like ["face", "fingerprint"]
    return [p.auth_type_name for p in policies]


def handle_user_sync(db: Session, action: str, data: dict):
    """
    Handles local DB updates for users sent from the Central Server.
    """
    try:
        if action == "upsert":
            # 1. Prepare the biometric data (Decode Base64 back to binary/BLOB)
            face_blob = base64.b64decode(data['face_template']) if data.get(
                'face_template') else None
            finger_blob = base64.b64decode(data['fingerprint_template']) if data.get(
                'fingerprint_template') else None

            # 2. Use an UPSERT logic (ON DUPLICATE KEY UPDATE)
            # This matches your specific tbl_user structure
            sql = text("""
                INSERT INTO tbl_user 
                (id, group_id, subgroup_id, terminal_id, fname, lname, gender, user_type,
                 face_template, fingerprint_template, card_serial_code)
                VALUES (:id, :group_id, :subgroup_id, :terminal_id, :fname, :lname, :gender, :user_type,
                        :face_template, :fingerprint_template, :card_serial_code)
                ON DUPLICATE KEY UPDATE
                group_id = VALUES(group_id),
                subgroup_id = VALUES(subgroup_id),
                fname = VALUES(fname),
                lname = VALUES(lname),
                gender = VALUES(gender),
                user_type = VALUES(user_type),
                face_template = VALUES(face_template),
                fingerprint_template = VALUES(fingerprint_template),
                card_serial_code = VALUES(card_serial_code)
            """)

            db.execute(sql, {
                "id": data['id'],
                "group_id": data['group_id'],
                "subgroup_id": data['subgroup_id'],
                "terminal_id": data['terminal_id'],
                "fname": data['fname'],
                "lname": data['lname'],
                "gender": data['gender'],
                "user_type": data['user_type'],
                "face_template": face_blob,
                "fingerprint_template": finger_blob,
                "card_serial_code": data['card_serial_code']
            })
            logging.info(f"Successfully upserted user ID: {data['id']}")

        elif action == "delete":
            # 3. Simple delete by ID
            sql = text("DELETE FROM tbl_user WHERE id = :id")
            db.execute(sql, {"id": data['id']})
            logging.info(f"Successfully deleted user ID: {data['id']}")

    except Exception as e:
        db.rollback()
        logging.error(f"Failed to handle user sync: {e}")
        raise e
