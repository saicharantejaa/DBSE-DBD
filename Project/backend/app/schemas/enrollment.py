"""
app/schemas/enrollment.py
Pydantic models for enrollment endpoints.
"""
from pydantic import BaseModel

from app.schemas.course import CourseListItem


class EnrollRequest(BaseModel):
    student_id: int
    course_id:  int
