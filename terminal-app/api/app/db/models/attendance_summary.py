from sqlalchemy import (
    Column,
    Integer,
    Enum,
    ForeignKey,
    Date,
    TIMESTAMP,
    DECIMAL,
    String,
    Boolean,
    UniqueConstraint,
    Index
)
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy.orm import relationship


class AttendanceSummary(Base):
    __tablename__ = "tbl_attendance_summary"

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
        nullable=True,
        index=True
    )

    attendance_date = Column(Date, nullable=False, index=True)

    attendance_context = Column(
        Enum("daily", "event", name="attendance_context_enum"),
        nullable=False
    )

    event_id = Column(
        Integer,
        ForeignKey("tbl_event.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    first_checkin = Column(TIMESTAMP, nullable=True)
    last_checkout = Column(TIMESTAMP, nullable=True)

    total_hours = Column(DECIMAL(5, 2), default=0.00)

    attendance_status = Column(String(100), nullable=False, index=True)

    derived_from_session = Column(Boolean, default=True)

    generated_at = Column(
        TIMESTAMP,
        nullable=True,
        server_default=func.now()  # pylint: disable=not-callable
    )

    # Unique constraint
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "attendance_context",
            "event_id",
            "attendance_date",
            name="unique_user_context_event_date"
        ),
        Index("idx_summary_terminal", "terminal_id"),
        Index("idx_summary_event", "event_id"),
        Index("idx_summary_user", "user_id"),
        Index("idx_summary_date", "attendance_date"),
        Index("idx_summary_status", "attendance_status"),
    )

    # Relationships
    user = relationship("User", back_populates="attendance_summary")
    terminal = relationship("Terminal", back_populates="attendance_summary")
    event = relationship("Event", back_populates="attendance_summary")
