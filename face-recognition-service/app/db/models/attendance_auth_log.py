from sqlalchemy import (
    Column,
    Integer,
    Enum,
    ForeignKey,
    TIMESTAMP,
    UniqueConstraint,
    Index
)
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy.orm import relationship


class AttendanceAuthLog(Base):
    __tablename__ = "tbl_attendance_auth_log"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("tbl_user.id"),
        nullable=False,
        index=True
    )

    terminal_id = Column(
        Integer,
        ForeignKey("tbl_terminal.id"),
        nullable=False,
        index=True
    )

    attendance_context = Column(
        Enum("daily", "event", name="authlog_context_enum"),
        nullable=False
    )

    event_id = Column(
        Integer,
        ForeignKey("tbl_event.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    captured_at = Column(
        TIMESTAMP,
        nullable=True,
        server_default=func.now(),  # pylint: disable=not-callable
        index=True
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "terminal_id",
            "attendance_context",
            "event_id",
            name="unique_user_terminal_context_event"
        ),
        Index("idx_authlog_time", "captured_at"),
    )

    # Relationships
    user = relationship("User", back_populates="attendance_logs")
    terminal = relationship("Terminal", back_populates="attendance_logs")
    event = relationship("Event", back_populates="attendance_logs")
