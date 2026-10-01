"""
app/models/enrollment.py
ORM model for the `enrollments` table.
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint, func
from app.db.postgres import Base


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("student_id", "course_id"),)

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("users.id",   ondelete="CASCADE"))
    course_id   = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    enrolled_at = Column(DateTime, server_default=func.now())
