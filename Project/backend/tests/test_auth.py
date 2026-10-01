"""
tests/test_auth.py
Tests for auth endpoints: register, login, wrong password.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_new_user(client: AsyncClient):
    """Registering a brand new user returns 201 and a JWT token."""
    resp = await client.post("/auth/register", json={
        "name": "Test Student",
        "email": "testauth_new@example.com",
        "password": "secret123",
        "role": "student",
    })
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "testauth_new@example.com"
    assert data["user"]["role"] == "student"
    assert "avatar" in data["user"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Registering the same email twice returns 409 Conflict."""
    payload = {
        "name": "Dup User",
        "email": "testauth_dup@example.com",
        "password": "pass1",
        "role": "student",
    }
    r1 = await client.post("/auth/register", json=payload)
    assert r1.status_code == 201

    r2 = await client.post("/auth/register", json=payload)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_login_correct_password(client: AsyncClient):
    """Login with correct credentials returns 200 and a JWT."""
    # First register
    await client.post("/auth/register", json={
        "name": "Login Tester",
        "email": "testauth_login@example.com",
        "password": "correctpass",
        "role": "student",
    })
    # Then login
    resp = await client.post("/auth/login", json={
        "email": "testauth_login@example.com",
        "password": "correctpass",
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """Login with wrong password returns 401 Unauthorized."""
    await client.post("/auth/register", json={
        "name": "Wrong PW",
        "email": "testauth_wrongpw@example.com",
        "password": "rightpassword",
        "role": "student",
    })
    resp = await client.post("/auth/login", json={
        "email": "testauth_wrongpw@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Login with unknown email returns 401."""
    resp = await client.post("/auth/login", json={
        "email": "nobody@example.com",
        "password": "anything",
    })
    assert resp.status_code == 401
