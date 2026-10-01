"""
app/models/course_content.py
ORM model for the `course_content` table.
"""
import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, func
from app.db.postgres import Base


class ContentType(str, enum.Enum):
    text  = "text"
    pdf   = "pdf"
    video = "video"
    slide = "slide"
    link  = "link"


class CourseContent(Base):
    __tablename__ = "course_content"

    id           = Column(Integer, primary_key=True, index=True)
    module_id    = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"))
    title        = Column(String(150), nullable=False)
    content_type = Column(Enum(ContentType, name="content_type", create_type=False), nullable=False)
    content_text = Column(Text)
    file_url     = Column(String(255))
    created_at   = Column(DateTime, server_default=func.now())
