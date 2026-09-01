from sqlalchemy import (
    Column,
    Integer,
    TIMESTAMP,
    ForeignKey,
    LargeBinary
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class FingerprintBuffer(Base):
    __tablename__ = "tbl_fingerprint_buffer"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("tbl_user.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    fingerprint_template = Column(LargeBinary, nullable=False)

    created_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now()  # pylint: disable=not-callable
    )

    # relationships
    user = relationship("User", back_populates="fingerprint_buffers")
