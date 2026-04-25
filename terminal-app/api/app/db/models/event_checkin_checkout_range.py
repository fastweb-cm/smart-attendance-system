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


class EventCheckinCheckoutRange(Base):
    __tablename__ = "tbl_event_checkin_checkout_range"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey(
        "tbl_event.id", ondelete="CASCADE"), nullable=False)

    checkin_start_datetime = Column(DateTime, nullable=False)
    checkin_end_datetime = Column(DateTime, nullable=False)
    checkout_start_datetime = Column(DateTime, nullable=True)
    checkout_end_datetime = Column(DateTime, nullable=True)

    __table_args__ = (
        Index('idx_event_check_range_event', 'event_id'),
    )

    # Relationships
    event = relationship("Event", back_populates="checkin_ranges")
