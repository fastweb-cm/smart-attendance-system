from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    ForeignKey,
    DateTime
)
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "tbl_user"

    id = Column(Integer, primary_key=True, autoincrement=True)

    class_id = Column(Integer, ForeignKey("tbl_class.id"), index=True)

    fname = Column(String(100), nullable=False)
    lname = Column(String(100), nullable=False)

    email = Column(String(255), unique=True, index=True)

    gender = Column(
        Enum("male", "female", name="gender_enum"),
        nullable=False
    )

    username = Column(String(100), unique=True, index=True)

    password_hash = Column(String(255))

    user_type = Column(
        Enum("student", "staff", name="user_type_enum"),
        nullable=False,
        index=True
    )

    status = Column(
        Enum("active", "inactive", "dismissed", name="status_enum"),
        default="active",
        index=True
    )

    biometric_enrollment_status = Column(
        Enum("pending", "completed", name="biometric_status_enum"),
        default="pending"
    )

    biometric_profile = relationship(
        "BiometricProfile", uselist=False, back_populates="user")
