from sqlalchemy.orm import Session
from app.db.models.users import User


def get_user_by_id(db: Session, id: int):
    return db.query(User).filter(User.id == id).first()
