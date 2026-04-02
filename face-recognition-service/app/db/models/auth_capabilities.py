from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey
)
from app.db.base import Base
from sqlalchemy.orm import relationship


class AuthCapability(Base):
    __tablename__ = "tbl_auth_capabilities"

    id = Column(Integer, primary_key=True, autoincrement=True)

    terminal_id = Column(
        Integer,
        ForeignKey("tbl_terminal.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    auth_type_id = Column(Integer, nullable=True)
    auth_step = Column(Integer, nullable=True)

    auth_type_name = Column(String(50), nullable=True)

    # Relationship
    terminal = relationship("Terminal", back_populates="auth_capabilities")
