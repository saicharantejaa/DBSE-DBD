"""
app/services/course_service.py
Business logic for courses, enrollments, and analytics.
"""
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import course_repo, enrollment_repo
from app.schemas.course import CourseAnalytics, CourseDetail, CourseListItem, ContentOut, ModuleOut
from app.schemas.enrollment import EnrollRequest


# Utility: compute tag from course position (mirrors mock API)
_TAG_MAP = {1: "Core", 2: "Advanced"}


async def _course_to_list_item(
    db: AsyncSession, course, include_module_count: bool = True
) -> CourseListItem:
    instructor_name = await course_repo.get_instructor_name(db, course.instructor_id) or course.coordinator
    modules = await course_repo.get_modules_for_course(db, course.id)
    tag = getattr(course, "course_code", None) or _TAG_MAP.get(course.id, "Core")
    return CourseListItem(
        id=course.id,
        course_code=getattr(course, "course_code", None),
        title=course.title,
        description=course.description,
        instructor=instructor_name,
        instructorId=course.instructor_id,
        tag=tag,
        credits=getattr(course, "credits", None),
        coordinator=getattr(course, "coordinator", None),
        prerequisite=getattr(course, "prerequisite", None),
        moduleCount=len(modules),
    )


async def list_courses(db: AsyncSession) -> List[CourseListItem]:
    courses = await course_repo.get_all_courses(db)
    return [await _course_to_list_item(db, c) for c in courses]


async def get_course_detail(db: AsyncSession, course_id: int) -> CourseDetail:
    course = await course_repo.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    instructor_name = await course_repo.get_instructor_name(db, course.instructor_id) or course.coordinator
    modules = await course_repo.get_modules_for_course(db, course.id)
    tag = getattr(course, "course_code", None) or _TAG_MAP.get(course.id, "Core")

    module_outs = []
    for mod in modules:
        content_rows = await course_repo.get_content_for_module(db, mod.id)
        content_outs = []
        for c in content_rows:
            snippet = None
            url = None
            if c.content_type == "text" and c.content_text:
                snippet = c.content_text[:250]
            else:
                url = c.file_url
            content_outs.append(
                ContentOut(
                    id=c.id,
                    title=c.title,
                    type=c.content_type,
                    snippet=snippet,
                    url=url,
                )
            )
        module_outs.append(
            ModuleOut(
                id=mod.id,
                title=mod.title,
                orderIndex=mod.order_index,
                content=content_outs,
            )
        )

    return CourseDetail(
        id=course.id,
        course_code=getattr(course, "course_code", None),
        title=course.title,
        description=course.description,
        instructor=instructor_name,
        instructorId=course.instructor_id,
        tag=tag,
        credits=getattr(course, "credits", None),
        coordinator=getattr(course, "coordinator", None),
        prerequisite=getattr(course, "prerequisite", None),
        modules=module_outs,
    )


async def list_enrollments(db: AsyncSession, student_id: int) -> List[CourseListItem]:
    courses = await enrollment_repo.get_enrolled_courses(db, student_id)
    return [await _course_to_list_item(db, c) for c in courses]


async def enroll(db: AsyncSession, payload: EnrollRequest) -> dict:
    """Calls the enroll_student stored procedure (CO1 evidence)."""
    await enrollment_repo.enroll_student(db, payload.student_id, payload.course_id)
    await db.commit()
    return {"message": "Enrolled successfully."}


async def get_analytics(db: AsyncSession, course_id: int) -> CourseAnalytics:
    """Reads the course_doubt_analytics view (CO1 evidence)."""
    row = await course_repo.get_course_analytics(db, course_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")
    return CourseAnalytics(**row)


async def get_all_analytics(db: AsyncSession) -> List[CourseAnalytics]:
    rows = await course_repo.get_all_course_analytics(db)
    return [CourseAnalytics(**r) for r in rows]
