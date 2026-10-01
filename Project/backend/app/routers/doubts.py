"""
app/routers/doubts.py
GET /doubts?studentId=  |  ?instructorId=
GET /doubts/{id}
POST /doubts   — runs the full RAG pipeline and returns doubt + response + sources
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.schemas.doubt import DoubtCreate, DoubtDetail, DoubtListItem
from app.services import doubt_service

router = APIRouter(prefix="/doubts", tags=["doubts"])


@router.get("", response_model=List[DoubtListItem])
async def list_doubts(
    studentId:    Optional[int] = Query(None),
    instructorId: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns doubts filtered by student OR instructor.
    Matches mock-api shape: studentId → student's own doubts;
    instructorId → all doubts across their courses.
    """
    if studentId:
        return await doubt_service.get_student_doubts(db, studentId)
    if instructorId:
        return await doubt_service.get_instructor_doubts(db, instructorId)
    return []


@router.get("/{doubt_id}", response_model=DoubtDetail)
async def get_doubt(doubt_id: int, db: AsyncSession = Depends(get_db)):
    """Return a single doubt with its AI response and source citations."""
    return await doubt_service.get_doubt_detail(db, doubt_id)


@router.post("", response_model=DoubtDetail, status_code=status.HTTP_201_CREATED)
async def create_doubt(payload: DoubtCreate, db: AsyncSession = Depends(get_db)):
    """
    Submit a new doubt.
    Runs the full RAG pipeline atomically:
      create doubt → embed → pgvector search → generate answer →
      insert response (fires trigger) → insert sources → commit.
    Returns the doubt + response + sources in one payload.
    """
    return await doubt_service.submit_doubt(db, payload)
