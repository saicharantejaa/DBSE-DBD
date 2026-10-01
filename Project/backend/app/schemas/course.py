"""
app/schemas/course.py
Pydantic response models for courses, modules, and content.
These match the shapes returned by the mock API so that the frontend
pages (CatalogPage, CourseDetailPage, DoubtSolverPage) keep working.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


# ── Content ─────────────────────────────────────────────────────────────────

class ContentOut(BaseModel):
    id:           int
    title:        str
    type:         str          # maps to content_type enum value
    snippet:      Optional[str] = None  # first 200 chars of content_text
    url:          Optional[str] = None  # file_url for non-text types

    model_config = {"from_attributes": True}


# ── Module ───────────────────────────────────────────────────────────────────

class ModuleOut(BaseModel):
    id:         int
    title:      str
    orderIndex: int
    content:    List[ContentOut] = []

    model_config = {"from_attributes": True}


# ── Course list item (catalog / enrollment list) ─────────────────────────────

class CourseListItem(BaseModel):
    id:           int
    course_code:  Optional[str] = None
    title:        str
    description:  Optional[str] = None
    instructor:   Optional[str] = None  # instructor display name
    instructorId: Optional[int] = None
    tag:          str = "Core"
    credits:      Optional[int] = None
    coordinator:  Optional[str] = None
    prerequisite: Optional[str] = None
    moduleCount:  int = 0

    model_config = {"from_attributes": True}


# ── Course detail (full with modules) ────────────────────────────────────────

class CourseDetail(BaseModel):
    id:           int
    course_code:  Optional[str] = None
    title:        str
    description:  Optional[str] = None
    instructor:   Optional[str] = None
    instructorId: Optional[int] = None
    tag:          str = "Core"
    credits:      Optional[int] = None
    coordinator:  Optional[str] = None
    prerequisite: Optional[str] = None
    modules:      List[ModuleOut] = []

    model_config = {"from_attributes": True}


# ── Analytics (from the view) ─────────────────────────────────────────────────

class CourseAnalytics(BaseModel):
    course_id:        int
    title:            str
    total_doubts:     int
    pending_doubts:   int
    answered_doubts:  int
    escalated_doubts: int
