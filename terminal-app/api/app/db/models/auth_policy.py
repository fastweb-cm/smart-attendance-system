from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey
)
from app.db.base import Base
from sqlalchemy.orm import relationship


class AuthPolicy(Base):
    __tablename__ = "tbl_auth_policy"

    id = Column(Integer, primary_key=True, autoincrement=False)

    terminal_id = Column(
        Integer,
        ForeignKey("tbl_terminal.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    group_id = Column(Integer, nullable=True)
    subgroup_id = Column(Integer, nullable=True)

    auth_type_id = Column(Integer, nullable=True)

    group_name = Column(String(100), nullable=True)
    auth_type_name = Column(String(50), nullable=True)

    # Relationship
    terminal = relationship("Terminal", back_populates="auth_policies")
