"""
app/models/course.py
ORM model for the `courses` table.
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from app.db.postgres import Base


class Course(Base):
    __tablename__ = "courses"

    id            = Column(Integer, primary_key=True, index=True)
    course_code   = Column(String(20), unique=True, index=True)
    title         = Column(String(150), nullable=False)
    description   = Column(Text)
    credits       = Column(Integer)
    coordinator   = Column(String(150))
    prerequisite  = Column(String(255))
    instructor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at    = Column(DateTime, server_default=func.now())

