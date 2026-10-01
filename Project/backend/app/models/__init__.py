"""
app/models/__init__.py
Re-exports all ORM models so that SQLAlchemy's metadata is fully populated
when alembic or create_all() is called.
"""
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.module import Module
from app.models.course_content import CourseContent
from app.models.doubt import Doubt
from app.models.doubt_response import DoubtResponse
from app.models.doubt_response_source import DoubtResponseSource
from app.models.content_embedding import ContentEmbedding

__all__ = [
    "User",
    "Course",
    "Enrollment",
    "Module",
    "CourseContent",
    "Doubt",
    "DoubtResponse",
    "DoubtResponseSource",
    "ContentEmbedding",
]
