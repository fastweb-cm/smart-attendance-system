from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    LargeBinary
)

from sqlalchemy.orm import relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "tbl_user"

    id = Column(Integer, primary_key=True, autoincrement=False)

    terminal_id = Column(
        Integer,
        ForeignKey(
            "tbl_terminal.id",
            ondelete="CASCADE"
        ),
        index=True
    )

    fname = Column(String(100))
    lname = Column(String(100))
    gender = Column(String(10))
    user_type = Column(String(50))

    face_template = Column(LargeBinary)
    fingerprint_template = Column(LargeBinary)

    card_serial_code = Column(String(255))

    # -----------------
    # Relationships
    # -----------------

    terminal = relationship(
        "Terminal",
        back_populates="users"
    )

    permissions = relationship(
        "UserPermission",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    events_created = relationship(
        "Event",
        back_populates="creator",
        passive_deletes=True
    )

    auth_sessions = relationship(
        "AuthSession",
        back_populates="user"
    )

    attendance_logs = relationship(
        "AttendanceAuthLog",
        back_populates="user"
    )

    attendance_sessions = relationship(
        "AttendanceSession",
        back_populates="user"
    )

    attendance_summaries = relationship(
        "AttendanceSummary",
        back_populates="user"
    )
