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
