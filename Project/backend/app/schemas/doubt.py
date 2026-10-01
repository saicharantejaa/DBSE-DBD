"""
app/schemas/doubt.py
Pydantic request / response models for doubts and their AI responses.
Shapes are aligned with what DoubtSolverPage.jsx and MyDoubtsPage.jsx expect.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


# ── Source (RAG chunk referenced in an answer) ────────────────────────────────

class SourceOut(BaseModel):
    contentId:   int
    title:       str
    type:        str
    moduleTitle: Optional[str] = None


# ── Doubt response ─────────────────────────────────────────────────────────────

class DoubtResponseOut(BaseModel):
    answerText:      str
    confidenceScore: Optional[float] = None
    sources:         List[SourceOut] = []


# ── Doubt list item (for student & instructor list views) ─────────────────────

class DoubtListItem(BaseModel):
    id:           int
    questionText: str
    status:       str
    createdAt:    Optional[datetime] = None
    courseId:     Optional[int] = None
    moduleId:     Optional[int] = None
    courseTitle:  Optional[str] = None
    moduleTitle:  Optional[str] = None
    hasResponse:  bool = False
    # Instructor-view extras
    studentId:    Optional[int] = None
    studentName:  Optional[str] = None


# ── Full doubt detail ─────────────────────────────────────────────────────────

class DoubtDetail(BaseModel):
    id:           int
    studentId:    int
    courseId:     Optional[int] = None
    moduleId:     Optional[int] = None
    questionText: str
    status:       str
    createdAt:    Optional[datetime] = None
    response:     Optional[DoubtResponseOut] = None


# ── Submit new doubt ──────────────────────────────────────────────────────────

class DoubtCreate(BaseModel):
    studentId:    int
    courseId:     int
    moduleId:     Optional[int] = None
    questionText: str
