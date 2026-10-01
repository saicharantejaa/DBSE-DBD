"""
app/repositories/course_repo.py
Raw database access for courses, modules, and course_content.
"""
from typing import List, Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.module import Module
from app.models.course_content import CourseContent
from app.models.user import User


async def get_all_courses(db: AsyncSession) -> List[Course]:
    result = await db.execute(select(Course).order_by(Course.id))
    return result.scalars().all()


async def get_course_by_id(db: AsyncSession, course_id: int) -> Optional[Course]:
    result = await db.execute(select(Course).where(Course.id == course_id))
    return result.scalar_one_or_none()


async def get_modules_for_course(db: AsyncSession, course_id: int) -> List[Module]:
    result = await db.execute(
        select(Module)
        .where(Module.course_id == course_id)
        .order_by(Module.order_index)
    )
    return result.scalars().all()


async def get_content_for_module(db: AsyncSession, module_id: int) -> List[CourseContent]:
    result = await db.execute(
        select(CourseContent).where(CourseContent.module_id == module_id)
    )
    return result.scalars().all()


async def get_all_content(db: AsyncSession) -> List[CourseContent]:
    """Used by the embedding seeder script."""
    result = await db.execute(select(CourseContent))
    return result.scalars().all()


async def get_instructor_name(db: AsyncSession, instructor_id: Optional[int]) -> Optional[str]:
    if instructor_id is None:
        return None
    result = await db.execute(select(User.name).where(User.id == instructor_id))
    return result.scalar_one_or_none()


async def get_course_analytics(db: AsyncSession, course_id: int):
    """Read the course_doubt_analytics view for one course (CO1 view evidence)."""
    row = await db.execute(
        text("SELECT * FROM course_doubt_analytics WHERE course_id = :cid"),
        {"cid": course_id},
    )
    return row.mappings().one_or_none()


async def get_all_course_analytics(db: AsyncSession):
    """Read the full course_doubt_analytics view (CO1 view evidence)."""
    rows = await db.execute(text("SELECT * FROM course_doubt_analytics ORDER BY course_id"))
    return rows.mappings().all()
