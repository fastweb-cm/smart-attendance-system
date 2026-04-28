from sqlalchemy import (
    Column,
    Integer,
    Enum,
    ForeignKey
)

from sqlalchemy.orm import relationship
from app.db.base import Base


class UserPermission(Base):
    __tablename__ = "tbl_user_permission"

    id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey(
            "tbl_user.id",
            ondelete="CASCADE"
        ),
        index=True
    )

    group_id = Column(Integer)
    subgroup_id = Column(Integer, nullable=True)

    context = Column(
        Enum("daily", "event"),
        nullable=False
    )

    event_id = Column(
        Integer,
        ForeignKey(
            "tbl_event.id",
            ondelete="CASCADE"
        ),
        nullable=True,
        index=True
    )

    user = relationship(
        "User",
        back_populates="permissions"
    )

    event = relationship(
        "Event",
        back_populates="permissions"
    )
