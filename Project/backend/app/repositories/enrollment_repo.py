"""
app/repositories/enrollment_repo.py
Raw database access for enrollments.
The actual enrollment uses the stored procedure enroll_student() from schema.sql
so this repo wraps CALL enroll_student(...) — CO1 stored procedure evidence.
"""
from typing import List

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enrollment import Enrollment
from app.models.course import Course


async def enroll_student(db: AsyncSession, student_id: int, course_id: int) -> None:
    """
    Calls the enroll_student stored procedure (defined in db/schema.sql).
    The procedure performs an idempotent INSERT into enrollments, preventing
    duplicate enrollment without raising a UniqueViolation.
    CO1 Evidence: stored procedure called via CALL statement.
    """
    await db.execute(
        text("CALL enroll_student(:sid, :cid)"),
        {"sid": student_id, "cid": course_id},
    )


async def get_enrolled_course_ids(db: AsyncSession, student_id: int) -> List[int]:
    result = await db.execute(
        select(Enrollment.course_id).where(Enrollment.student_id == student_id)
    )
    return [row[0] for row in result.all()]


async def get_enrolled_courses(db: AsyncSession, student_id: int) -> List[Course]:
    enrolled_ids = await get_enrolled_course_ids(db, student_id)
    if not enrolled_ids:
        return []
    result = await db.execute(
        select(Course).where(Course.id.in_(enrolled_ids)).order_by(Course.id)
    )
    return result.scalars().all()
