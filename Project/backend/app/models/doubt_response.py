"""
app/models/doubt_response.py
ORM model for the `doubt_responses` table.
"""
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, Text, func
from app.db.postgres import Base


class DoubtResponse(Base):
    __tablename__ = "doubt_responses"

    id               = Column(Integer, primary_key=True, index=True)
    doubt_id         = Column(Integer, ForeignKey("doubts.id", ondelete="CASCADE"))
    answer_text      = Column(Text, nullable=False)
    confidence_score = Column(Float)
    generated_at     = Column(DateTime, server_default=func.now())
