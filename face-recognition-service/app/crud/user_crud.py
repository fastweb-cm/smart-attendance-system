from sqlalchemy.orm import Session
from app.db.models.users import User


def get_user_by_id(db: Session, id: int):
    return db.query(User).filter(User.id == id).first()


def get_user_details_by_id(db: Session, id: int):
    return db.query(User.id, User.group_id, User.subgroup_id, User.fname, User.lname).filter(User.id == id).first()


# get user face embedding template by user id
def get_user_face_template_by_id(db: Session, id: int):
    user = db.query(User.face_template).filter(User.id == id).first()
    return user[0] if user else None
