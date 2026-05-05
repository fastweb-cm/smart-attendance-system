from sqlalchemy import (
    Column,
    Integer,
    Float,
    TIMESTAMP,
    String,
    ForeignKey,
    LargeBinary
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class FaceBuffer(Base):
    __tablename__ = "tbl_face_buffer"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("tbl_user.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    face_template = Column(LargeBinary)
    confidence_score = Column(Float)

    created_at = Column(
        TIMESTAMP,
        nullable=True,
        server_default=func.now()  # pylint: disable=not-callable
    )

    # relationships
    user = relationship("User", back_populates="face_buffers")
