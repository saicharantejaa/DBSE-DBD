"""
app/repositories/doubt_repo.py
Raw database access for doubts, doubt_responses, and doubt_response_sources.
"""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.doubt import Doubt
from app.models.doubt_response import DoubtResponse
from app.models.doubt_response_source import DoubtResponseSource
from app.models.course import Course
from app.models.module import Module
from app.models.course_content import CourseContent
from app.models.user import User


async def create_doubt(
    db: AsyncSession,
    student_id: int,
    course_id: int,
    module_id: Optional[int],
    question_text: str,
) -> Doubt:
    doubt = Doubt(
        student_id=student_id,
        course_id=course_id,
        module_id=module_id,
        question_text=question_text,
    )
    db.add(doubt)
    await db.flush()
    return doubt


async def create_doubt_response(
    db: AsyncSession,
    doubt_id: int,
    answer_text: str,
    confidence_score: float,
) -> DoubtResponse:
    """
    Inserting into doubt_responses fires the trg_mark_doubt_answered trigger
    which sets doubts.status = 'answered' for this doubt_id.
    CO1 Evidence: trigger fires on this INSERT.
    """
    resp = DoubtResponse(
        doubt_id=doubt_id,
        answer_text=answer_text,
        confidence_score=confidence_score,
    )
    db.add(resp)
    await db.flush()
    return resp


async def create_doubt_response_sources(
    db: AsyncSession,
    doubt_response_id: int,
    content_ids: List[int],
) -> List[DoubtResponseSource]:
    sources = [
        DoubtResponseSource(doubt_response_id=doubt_response_id, content_id=cid)
        for cid in content_ids
    ]
    db.add_all(sources)
    await db.flush()
    return sources


async def get_doubt_by_id(db: AsyncSession, doubt_id: int) -> Optional[Doubt]:
    result = await db.execute(select(Doubt).where(Doubt.id == doubt_id))
    return result.scalar_one_or_none()


async def get_response_for_doubt(
    db: AsyncSession, doubt_id: int
) -> Optional[DoubtResponse]:
    result = await db.execute(
        select(DoubtResponse).where(DoubtResponse.doubt_id == doubt_id)
    )
    return result.scalar_one_or_none()


async def get_sources_for_response(
    db: AsyncSession, doubt_response_id: int
) -> List[DoubtResponseSource]:
    result = await db.execute(
        select(DoubtResponseSource).where(
            DoubtResponseSource.doubt_response_id == doubt_response_id
        )
    )
    return result.scalars().all()


async def get_doubts_for_student(db: AsyncSession, student_id: int) -> List[Doubt]:
    result = await db.execute(
        select(Doubt)
        .where(Doubt.student_id == student_id)
        .order_by(Doubt.created_at.desc())
    )
    return result.scalars().all()


async def get_doubts_for_instructor_courses(
    db: AsyncSession, course_ids: List[int]
) -> List[Doubt]:
    if not course_ids:
        return []
    result = await db.execute(
        select(Doubt)
        .where(Doubt.course_id.in_(course_ids))
        .order_by(Doubt.created_at.desc())
    )
    return result.scalars().all()


async def get_course_ids_for_instructor(
    db: AsyncSession, instructor_id: int
) -> List[int]:
    result = await db.execute(
        select(Course.id).where(Course.instructor_id == instructor_id)
    )
    return [row[0] for row in result.all()]


async def get_course_title(db: AsyncSession, course_id: Optional[int]) -> Optional[str]:
    if course_id is None:
        return None
    result = await db.execute(select(Course.title).where(Course.id == course_id))
    return result.scalar_one_or_none()


async def get_module_title(db: AsyncSession, module_id: Optional[int]) -> Optional[str]:
    if module_id is None:
        return None
    result = await db.execute(select(Module.title).where(Module.id == module_id))
    return result.scalar_one_or_none()


async def get_content_by_id(
    db: AsyncSession, content_id: int
) -> Optional[CourseContent]:
    result = await db.execute(
        select(CourseContent).where(CourseContent.id == content_id)
    )
    return result.scalar_one_or_none()


async def get_student_name(db: AsyncSession, user_id: Optional[int]) -> Optional[str]:
    if user_id is None:
        return None
    result = await db.execute(select(User.name).where(User.id == user_id))
    return result.scalar_one_or_none()
