from sqlalchemy.orm import Session
from app.db.models.fingerprint_buffer import FingerprintBuffer
from app.db.models.users import User


def create_fingerprint_buffer_entry(db: Session, user_id: int, template_bytes: bytes) -> FingerprintBuffer:
    """Stores a successful scan in the buffer for auto-refinement."""
    entry = FingerprintBuffer(
        user_id=user_id,
        fingerprint_template=template_bytes
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_fingerprint_buffer_count_for_user(db: Session, user_id: int) -> int:
    """Counts collected buffer samples for a user."""
    return db.query(FingerprintBuffer).filter(FingerprintBuffer.user_id == user_id).count()


def get_fingerprint_buffers_by_user_id(db: Session, user_id: int) -> list[FingerprintBuffer]:
    """Retrieves stored print buffer samples."""
    return db.query(FingerprintBuffer).filter(FingerprintBuffer.user_id == user_id).all()


def clear_fingerprint_buffers_for_user(db: Session, user_id: int) -> None:
    """Clears the buffer after a successful template refinement cycle."""
    db.query(FingerprintBuffer).filter(
        FingerprintBuffer.user_id == user_id).delete()
    db.commit()
