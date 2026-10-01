"""
app/services/doubt_service.py
Business logic for creating doubts and running the RAG pipeline.
Multi-step operations are wrapped in a single transaction.
"""
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import doubt_repo, embedding_repo, course_repo
from app.schemas.doubt import (
    DoubtCreate,
    DoubtDetail,
    DoubtListItem,
    DoubtResponseOut,
    SourceOut,
)
from app.services.rag import embed_text, generate_answer, compute_confidence


async def submit_doubt(db: AsyncSession, payload: DoubtCreate) -> DoubtDetail:
    """
    Full end-to-end flow (single transaction):
      1. INSERT into doubts
      2. embed the question text
      3. pgvector similarity search against content_embeddings
      4. generate_answer from retrieved chunks
      5. INSERT into doubt_responses   ← fires trigger → doubt.status = 'answered'
      6. INSERT into doubt_response_sources for each chunk
      7. COMMIT
      8. Return a DoubtDetail matching the mock API shape
    """
    # Step 1 — Create the doubt row
    doubt = await doubt_repo.create_doubt(
        db,
        student_id=payload.studentId,
        course_id=payload.courseId,
        module_id=payload.moduleId,
        question_text=payload.questionText,
    )

    # Step 2 — Embed the question (deterministic mock; swap embed_text for real model)
    query_vec = embed_text(payload.questionText)

    # Step 3 — Similarity search (CO2: pgvector <=> operator)
    chunks = await embedding_repo.similarity_search(db, query_vec, limit=3)

    # Fallback: if no embeddings seeded yet, use a hard-coded response
    if not chunks:
        chunks = []

    # Step 4 — Generate answer
    answer_text = generate_answer(payload.questionText, chunks)
    confidence  = compute_confidence(chunks)

    # Step 5 — Insert response (CO1: this INSERT fires the trigger)
    response = await doubt_repo.create_doubt_response(
        db,
        doubt_id=doubt.id,
        answer_text=answer_text,
        confidence_score=confidence,
    )

    # Step 6 — Insert sources
    content_ids = [c["content_id"] for c in chunks]
    sources_rows = await doubt_repo.create_doubt_response_sources(
        db, response.id, content_ids
    )

    # Step 7 — Commit everything atomically
    await db.commit()

    # Step 8 — Build response payload
    source_outs = [
        SourceOut(
            contentId=chunk["content_id"],
            title=chunk["content_title"],
            type=chunk.get("content_type", "text"),
            moduleTitle=chunk.get("module_title"),
        )
        for chunk in chunks
    ]

    return DoubtDetail(
        id=doubt.id,
        studentId=doubt.student_id,
        courseId=doubt.course_id,
        moduleId=doubt.module_id,
        questionText=doubt.question_text,
        status="answered",   # trigger will have flipped it; reflect that immediately
        createdAt=doubt.created_at,
        response=DoubtResponseOut(
            answerText=answer_text,
            confidenceScore=confidence,
            sources=source_outs,
        ),
    )


async def get_student_doubts(
    db: AsyncSession, student_id: int
) -> List[DoubtListItem]:
    doubts = await doubt_repo.get_doubts_for_student(db, student_id)
    items = []
    for d in doubts:
        course_title = await doubt_repo.get_course_title(db, d.course_id)
        module_title = await doubt_repo.get_module_title(db, d.module_id)
        response_row = await doubt_repo.get_response_for_doubt(db, d.id)
        items.append(
            DoubtListItem(
                id=d.id,
                questionText=d.question_text,
                status=d.status,
                createdAt=d.created_at,
                courseId=d.course_id,
                moduleId=d.module_id,
                courseTitle=course_title,
                moduleTitle=module_title,
                hasResponse=response_row is not None,
            )
        )
    return items


async def get_instructor_doubts(
    db: AsyncSession, instructor_id: int
) -> List[DoubtListItem]:
    course_ids = await doubt_repo.get_course_ids_for_instructor(db, instructor_id)
    doubts = await doubt_repo.get_doubts_for_instructor_courses(db, course_ids)
    items = []
    for d in doubts:
        course_title  = await doubt_repo.get_course_title(db, d.course_id)
        student_name  = await doubt_repo.get_student_name(db, d.student_id)
        items.append(
            DoubtListItem(
                id=d.id,
                questionText=d.question_text,
                status=d.status,
                createdAt=d.created_at,
                courseId=d.course_id,
                courseTitle=course_title,
                studentId=d.student_id,
                studentName=student_name,
            )
        )
    return items


async def get_doubt_detail(db: AsyncSession, doubt_id: int) -> DoubtDetail:
    doubt = await doubt_repo.get_doubt_by_id(db, doubt_id)
    if not doubt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doubt not found.")

    response_row = await doubt_repo.get_response_for_doubt(db, doubt_id)
    response_out: Optional[DoubtResponseOut] = None

    if response_row:
        sources_rows = await doubt_repo.get_sources_for_response(db, response_row.id)
        source_outs = []
        for src in sources_rows:
            content = await doubt_repo.get_content_by_id(db, src.content_id)
            if content:
                module_title = await doubt_repo.get_module_title(db, content.module_id)
                source_outs.append(
                    SourceOut(
                        contentId=src.content_id,
                        title=content.title,
                        type=content.content_type,
                        moduleTitle=module_title,
                    )
                )
        response_out = DoubtResponseOut(
            answerText=response_row.answer_text,
            confidenceScore=response_row.confidence_score,
            sources=source_outs,
        )

    return DoubtDetail(
        id=doubt.id,
        studentId=doubt.student_id,
        courseId=doubt.course_id,
        moduleId=doubt.module_id,
        questionText=doubt.question_text,
        status=doubt.status,
        createdAt=doubt.created_at,
        response=response_out,
    )
