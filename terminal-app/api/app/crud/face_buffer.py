from sqlalchemy.orm import Session
from app.db.models.face_buffer import FaceBuffer


def create_face_buffer_entry(db: Session, user_id: int, face_template: bytes, confidence_score: float):
    """
    Creates a new face buffer entry for a user.
    """
    face_buffer_entry = FaceBuffer(
        user_id=user_id,
        face_template=face_template,
        confidence_score=confidence_score
    )
    db.add(face_buffer_entry)
    db.commit()


def get_face_buffer_count_for_user(db: Session, user_id: int):
    """
    Returns the count of face buffer entries for a given user.
    """
    return db.query(FaceBuffer).filter(FaceBuffer.user_id == user_id).count()


def get_face_buffers_by_user_id(db: Session, user_id: int):
    """
    Returns all face buffer entries for a given user."""
    return db.query(FaceBuffer).filter(FaceBuffer.user_id == user_id).all()


def clear_face_buffers_for_user(db: Session, user_id: int):
    """
    Deletes all face buffer entries for a given user.
    """
    db.query(FaceBuffer).filter(FaceBuffer.user_id == user_id).delete()
    db.commit()
