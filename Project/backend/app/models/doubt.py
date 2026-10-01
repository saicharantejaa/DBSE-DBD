"""
app/models/doubt.py
ORM model for the `doubts` table.
"""
import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text, func
from app.db.postgres import Base


class DoubtStatus(str, enum.Enum):
    pending   = "pending"
    answered  = "answered"
    escalated = "escalated"


class Doubt(Base):
    __tablename__ = "doubts"

    id            = Column(Integer, primary_key=True, index=True)
    student_id    = Column(Integer, ForeignKey("users.id",   ondelete="CASCADE"))
    course_id     = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"))
    module_id     = Column(Integer, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True)
    question_text = Column(Text, nullable=False)
    status        = Column(Enum(DoubtStatus, name="doubt_status", create_type=False), default=DoubtStatus.pending)
    created_at    = Column(DateTime, server_default=func.now())
