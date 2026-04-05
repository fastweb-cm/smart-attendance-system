from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, TIMESTAMP, UniqueConstraint
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy.orm import relationship


class AttendanceSession(Base):
    __tablename__ = "tbl_attendance_session"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tbl_user.id"), nullable=False)
    terminal_id = Column(Integer, ForeignKey(
        "tbl_terminal.id"), nullable=False)
    attendance_context = Column(Enum('daily', 'event'), nullable=False)
    event_id = Column(Integer, ForeignKey("tbl_event.id"), nullable=True)
    checkin_timestamp = Column(
        TIMESTAMP, nullable=False, server_default=func.now())  # pylint: disable=not-callable
    checkout_timestamp = Column(TIMESTAMP, nullable=True)
    checkin_status = Column(Enum('on time', 'late'), nullable=False)
    checkout_status = Column(Enum('on time', 'early'), nullable=True)
    session_status = Column(
        Enum('active', 'completed', 'missed checkout'), default='active')
    sync_status = Column(Enum('pending', 'synced', 'error'), default='pending')
    created_at = Column(
        TIMESTAMP,
        server_default=func.now()  # pylint: disable=not-callable
    )

    # relationships
    user = relationship("User", back_populates="attendance_sessions")
    terminal = relationship("Terminal", back_populates="attendance_sessions")
    event = relationship("Event", back_populates="attendance_sessions")
