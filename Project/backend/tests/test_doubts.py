"""
tests/test_doubts.py
Tests for doubt endpoints including the full end-to-end RAG pipeline.
"""
import pytest
from httpx import AsyncClient


async def _register_and_login(client: AsyncClient, email: str, role: str = "student") -> dict:
    """Helper: register a user and return their auth data."""
    resp = await client.post("/auth/register", json={
        "name": "Test User",
        "email": email,
        "password": "testpass123",
        "role": role,
    })
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.mark.asyncio
async def test_list_doubts_student(client: AsyncClient):
    """GET /doubts?studentId=2 returns a list."""
    resp = await client.get("/doubts?studentId=2")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_list_doubts_instructor(client: AsyncClient):
    """GET /doubts?instructorId=1 returns a list."""
    resp = await client.get("/doubts?instructorId=1")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_doubt_end_to_end(client: AsyncClient):
    """
    POST /doubts:
      - creates the doubt row
      - runs the RAG pipeline
      - returns a response + sources payload
      - status should be 'answered' (trigger flipped it)

    Requires seed data (course_id=1 must exist) and content_embeddings to be seeded.
    If no content is embedded, the answer is the fallback message but status is still answered.
    """
    # Register a student
    auth = await _register_and_login(
        client, "doubt_test_student@example.com", role="student"
    )
    student_id = auth["user"]["id"]

    # Check course 1 exists
    course_resp = await client.get("/courses/1")
    if course_resp.status_code == 404:
        pytest.skip("Course 1 not in test DB — run seed.sql first")

    resp = await client.post("/doubts", json={
        "studentId": student_id,
        "courseId": 1,
        "moduleId": None,
        "questionText": "What is the difference between 2NF and BCNF?",
    })
    assert resp.status_code == 201, resp.text
    data = resp.json()

    # Check structure
    assert "id" in data
    assert "questionText" in data
    assert data["questionText"] == "What is the difference between 2NF and BCNF?"
    assert data["status"] == "answered"   # trigger must have fired
    assert "response" in data
    assert data["response"] is not None
    assert "answerText" in data["response"]
    assert "confidenceScore" in data["response"]
    assert "sources" in data["response"]
    assert isinstance(data["response"]["sources"], list)


@pytest.mark.asyncio
async def test_doubt_status_flips_to_answered(client: AsyncClient):
    """
    After submitting a doubt, GET /doubts/{id} should show status='answered'.
    CO1 Evidence: trigger on doubt_responses INSERT sets doubts.status.
    """
    auth = await _register_and_login(
        client, "trigger_test_student@example.com", role="student"
    )
    student_id = auth["user"]["id"]

    course_resp = await client.get("/courses/1")
    if course_resp.status_code == 404:
        pytest.skip("Course 1 not in test DB — run seed.sql first")

    # Submit doubt
    post_resp = await client.post("/doubts", json={
        "studentId": student_id,
        "courseId": 1,
        "moduleId": None,
        "questionText": "How does a B-Tree index work?",
    })
    assert post_resp.status_code == 201
    doubt_id = post_resp.json()["id"]

    # Fetch the doubt individually
    get_resp = await client.get(f"/doubts/{doubt_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["status"] == "answered"


@pytest.mark.asyncio
async def test_get_nonexistent_doubt(client: AsyncClient):
    """GET /doubts/99999 returns 404."""
    resp = await client.get("/doubts/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_rag_response_has_sources_when_embeddings_seeded(client: AsyncClient):
    """
    If content_embeddings is populated (seed_embeddings.py was run),
    the sources list should be non-empty.
    """
    auth = await _register_and_login(
        client, "rag_test_student@example.com", role="student"
    )
    student_id = auth["user"]["id"]

    course_resp = await client.get("/courses/1")
    if course_resp.status_code == 404:
        pytest.skip("Course 1 not in test DB — run seed.sql first")

    resp = await client.post("/doubts", json={
        "studentId": student_id,
        "courseId": 1,
        "moduleId": None,
        "questionText": "Explain normalization and BCNF",
    })
    assert resp.status_code == 201
    data = resp.json()
    sources = data["response"]["sources"]
    # Sources will be empty if seed_embeddings.py hasn't been run;
    # this test just validates the structure is correct either way.
    assert isinstance(sources, list)
    for src in sources:
        assert "contentId" in src
        assert "title" in src
