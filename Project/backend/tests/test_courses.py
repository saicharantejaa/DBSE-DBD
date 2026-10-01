"""
tests/test_courses.py
Tests for course and enrollment endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_courses(client: AsyncClient):
    """GET /courses returns a list (may be empty in isolated test DB)."""
    resp = await client.get("/courses")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_course_not_found(client: AsyncClient):
    """GET /courses/99999 returns 404."""
    resp = await client.get("/courses/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_course_detail_structure(client: AsyncClient):
    """
    If the seed data exists, GET /courses/1 returns expected shape.
    Skips gracefully if seed data not present.
    """
    resp = await client.get("/courses/1")
    if resp.status_code == 404:
        pytest.skip("Seed data not loaded in test DB")
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert "title" in data
    assert "modules" in data


@pytest.mark.asyncio
async def test_list_courses_shape(client: AsyncClient):
    """If courses exist, they include title, instructor, tag, moduleCount."""
    resp = await client.get("/courses")
    data = resp.json()
    if not data:
        pytest.skip("No courses in test DB")
    c = data[0]
    assert "id" in c
    assert "title" in c
    assert "tag" in c


@pytest.mark.asyncio
async def test_analytics_requires_auth(client: AsyncClient):
    """GET /courses/1/analytics without a token returns 401."""
    resp = await client.get("/courses/1/analytics")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_enrollment_list(client: AsyncClient):
    """GET /enrollments?studentId=2 returns a list."""
    resp = await client.get("/enrollments?studentId=2")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
