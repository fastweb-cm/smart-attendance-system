from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column,
    Integer,
    Enum,
    ForeignKey,
    TIMESTAMP
)
from app.db.base import Base


class AuthSessionStep(Base):
    __tablename__ = "tbl_auth_session_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)

    session_id = Column(
        Integer,
        ForeignKey("tbl_auth_session.id"),
        index=True,
        nullable=False
    )

    auth_type = Column(
        Enum("face", "fingerprint", "card", name="auth_type_enum"),
        nullable=False
    )

    status = Column(
        Enum("pending", "completed", "failed",
             name="auth_session_step_status_enum"),
        default="pending"
    )

    verified_at = Column(
        TIMESTAMP,
        default=None,
        nullable=True
    )

    # Relationships
    auth_session = relationship("AuthSession", back_populates="steps")
