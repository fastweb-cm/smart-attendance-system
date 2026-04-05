from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    DateTime
)
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy.orm import relationship


class Terminal(Base):
    __tablename__ = "tbl_terminal"

    id = Column(Integer, primary_key=True, autoincrement=False)

    name = Column(String(255), nullable=True)
    slug = Column(String(255), unique=True, nullable=True)

    branch_id = Column(Integer, nullable=True)
    branch_name = Column(String(100), nullable=True)

    status = Column(
        Enum("active", "pending", "revoked", name="terminal_status_enum"),
        default="active"
    )

    date_created = Column(DateTime, nullable=True)

    # Relationships
    users = relationship(
        "User",
        back_populates="terminal",
        passive_deletes=True
    )

    auth_capabilities = relationship(
        "AuthCapability",
        back_populates="terminal",
        cascade="all, delete-orphan"
    )

    auth_policies = relationship(
        "AuthPolicy",
        back_populates="terminal",
        cascade="all, delete-orphan"
    )

    auth_sessions = relationship(
        "AuthSession",
        back_populates="terminal",
        cascade="all, delete-orphan"
    )

    attendance_logs = relationship(
        "AttendanceAuthLog",
        back_populates="terminal",
        cascade="all, delete-orphan"
    )

    # Attendance summaries for this terminal
    attendance_summary = relationship(
        "AttendanceSummary",
        back_populates="terminal",
        cascade="all, delete-orphan"
    )

    # relationship to attendance sessions
    attendance_sessions = relationship(
        "AttendanceSession",
        back_populates="terminal",
        cascade="all, delete-orphan"
    )
