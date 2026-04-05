from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Enum,
    ForeignKey,
    Boolean,
    TIMESTAMP,
    Index
)
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy.orm import relationship


class Event(Base):
    __tablename__ = "tbl_event"

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String(100), nullable=False)

    group_id = Column(Integer, nullable=True, index=True)
    subgroup_id = Column(Integer, nullable=True, index=True)

    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)

    affects_attendance = Column(Boolean, default=True)

    created_by = Column(
        Integer,
        ForeignKey("tbl_user.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    handshake = Column(
        Enum("1", "2", name="event_handshake_enum"),
        default="1"
    )

    created_at = Column(
        TIMESTAMP,
        nullable=True,
        server_default=func.now()  # pylint: disable=not-callable
    )

    __table_args__ = (
        Index("idx_event_time", "start_datetime", "end_datetime"),
    )

    # Relationships
    creator = relationship("User", back_populates="events_created")
    attendance_logs = relationship("AttendanceAuthLog", back_populates="event")

    # Logs associated with this event
    attendance_logs = relationship(
        "AttendanceAuthLog", back_populates="event", cascade="all, delete-orphan")

    # Attendance summaries for this event
    attendance_summary = relationship(
        "AttendanceSummary",
        back_populates="event",
        cascade="all, delete-orphan"
    )

    # relationship to attendance sessions
    attendance_sessions = relationship(
        "AttendanceSession",
        back_populates="event",
        cascade="all, delete-orphan"
    )
