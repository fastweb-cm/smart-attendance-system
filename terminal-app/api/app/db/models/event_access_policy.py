from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint, String, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class EventAccessPolicy(Base):
    __tablename__ = "tbl_event_access_policy"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey(
        "tbl_event.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    group_id = Column(Integer, nullable=True)
    subgroup_id = Column(Integer, nullable=True)
    auth_type_id = Column(Integer, nullable=False)
    auth_type_name = Column(String(50))

    __table_args__ = (
        UniqueConstraint('event_id', 'subgroup_id', 'auth_type_id',
                         'group_id', name='uq_event_scope_auth'),
    )

    # Relationships
    event = relationship("Event", back_populates="access_policies")
