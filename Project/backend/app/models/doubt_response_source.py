"""
app/models/doubt_response_source.py
ORM model for the `doubt_response_sources` table.
"""
from sqlalchemy import Column, ForeignKey, Integer
from app.db.postgres import Base


class DoubtResponseSource(Base):
    __tablename__ = "doubt_response_sources"

    id                = Column(Integer, primary_key=True, index=True)
    doubt_response_id = Column(Integer, ForeignKey("doubt_responses.id", ondelete="CASCADE"))
    content_id        = Column(Integer, ForeignKey("course_content.id",  ondelete="CASCADE"))
