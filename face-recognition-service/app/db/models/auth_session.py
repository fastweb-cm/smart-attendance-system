from sqlalchemy import (
    Column,
    Integer,
    Enum,
    ForeignKey,
    TIMESTAMP
)
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy.orm import relationship


class AuthSession(Base):
    __tablename__ = "tbl_auth_session"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("tbl_user.id"),
        index=True,
        nullable=False
    )

    terminal_id = Column(
        Integer,
        ForeignKey("tbl_terminal.id"),
        index=True,
        nullable=False
    )

    started_at = Column(
        TIMESTAMP,
        server_default=func.now()  # pylint: disable=not-callable
    )

    current_step = Column(Integer, default=1)

    status = Column(
        Enum("in_progress", "completed", name="auth_session_status_enum"),
        default="in_progress"
    )

    # Relationships
    user = relationship("User", back_populates="auth_sessions")
    terminal = relationship("Terminal", back_populates="auth_sessions")
