"""
app/routers/enrollments.py
GET /enrollments?studentId=  and  POST /enrollments
"""
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.schemas.course import CourseListItem
from app.schemas.enrollment import EnrollRequest
from app.services import course_service

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.get("", response_model=List[CourseListItem])
async def list_enrollments(
    studentId: int = Query(..., description="ID of the student"),
    db: AsyncSession = Depends(get_db),
):
    """Return all courses a student is enrolled in."""
    return await course_service.list_enrollments(db, studentId)


@router.post("", status_code=201)
async def enroll(payload: EnrollRequest, db: AsyncSession = Depends(get_db)):
    """
    Enroll a student in a course via the enroll_student() stored procedure.
    CO1 Evidence: calls CALL enroll_student(:sid, :cid) — idempotent.
    """
    return await course_service.enroll(db, payload)
