from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    LargeBinary
)
from app.db.base import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "tbl_user"

    id = Column(Integer, primary_key=True, autoincrement=False)

    group_id = Column(Integer, nullable=True)
    subgroup_id = Column(Integer, nullable=True)
    terminal_id = Column(
        Integer,
        ForeignKey("tbl_terminal.id", ondelete="CASCADE"),
        index=True
    )

    fname = Column(String(100), nullable=True)
    lname = Column(String(100), nullable=True)

    gender = Column(String(10), nullable=True)
    user_type = Column(String(50), nullable=True)

    face_template = Column(LargeBinary, nullable=True)
    fingerprint_template = Column(LargeBinary, nullable=True)

    card_serial_code = Column(String(255), nullable=True)

    # Optional relationship (if you have a Terminal model)
    terminal = relationship("Terminal", back_populates="users")

    # relationship to events
    events_created = relationship(
        "Event",
        back_populates="creator",
        cascade="all, delete-orphan"
    )

    # relationship to auth sessions
    auth_sessions = relationship(
        "AuthSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # relationship to attendance logs
    attendance_logs = relationship(
        "AttendanceAuthLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # Attendance summaries for this user
    attendance_summary = relationship(
        "AttendanceSummary",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # relationship to attendance sessions
    attendance_sessions = relationship(
        "AttendanceSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )
