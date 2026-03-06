from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base

# Define the SQLAlchemy model for the table tbl_biometricprofile


class BiometricProfile(Base):
    __tablename__ = "tbl_biometricprofile"

    # Primary key: auto-increment integer
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key pointing to the user table (tbl_user.id)
    # Nullable because the original column allows NULL
    user_id = Column(Integer, ForeignKey(
        "tbl_user.id", ondelete="CASCADE"), unique=True, nullable=True)

    # Face template stored as a BLOB
    face_template = Column(LargeBinary, nullable=True)

    # Fingerprint template stored as a BLOB
    fingerprint_template = Column(LargeBinary, nullable=True)

    # Card serial code as string (varchar 200)
    card_serial_code = Column(String(200), unique=True, nullable=True)

    # Optional: SQLAlchemy relationship to user object
    # Allows you to do: profile.user to access the user object
    user = relationship("User", back_populates="biometric_profile")

    # explicit unique constraints (already declared above with unique=True)
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_id"),
        UniqueConstraint("card_serial_code", name="uq_card_serial_code"),
    )
