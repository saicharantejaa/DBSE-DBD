"""
app/routers/courses.py
GET /courses, GET /courses/{id}, GET /courses/{id}/analytics
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.dependencies import require_role
from app.schemas.course import CourseAnalytics, CourseDetail, CourseListItem
from app.services import course_service

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=List[CourseListItem])
async def list_courses(db: AsyncSession = Depends(get_db)):
    """Return all courses (catalog view)."""
    return await course_service.list_courses(db)


@router.get("/{course_id}", response_model=CourseDetail)
async def get_course(course_id: int, db: AsyncSession = Depends(get_db)):
    """Return a single course with its full module + content tree."""
    return await course_service.get_course_detail(db, course_id)


@router.get("/{course_id}/analytics", response_model=CourseAnalytics)
async def get_course_analytics(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_role("instructor", "admin")),
):
    """
    Instructor-only: return doubt counts from the course_doubt_analytics view.
    CO1 Evidence: reads the SQL VIEW defined in db/schema.sql.
    """
    return await course_service.get_analytics(db, course_id)
