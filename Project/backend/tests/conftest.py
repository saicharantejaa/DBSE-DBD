"""
tests/conftest.py
Shared pytest fixtures for the backend test suite.

Strategy:
  - Connect to the real Postgres DB (TEST_DATABASE_URL or DATABASE_URL from .env)
  - Each test function gets a fresh DB session
  - Tests that modify data wrap in transactions that are rolled back on cleanup

NOTE: Tests require schema.sql to be applied (tables must exist).
The pgvector extension must be installed in Postgres.
"""
import asyncio
import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.postgres import get_db
from app.main import app as fastapi_app

# ── Database URL for tests ─────────────────────────────────────────────────────
# Priority: TEST_DATABASE_URL env var > DATABASE_URL env var > default
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:password@localhost:5432/learnai"
    ),
)

_test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, pool_size=2)
_TestSessionFactory = async_sessionmaker(
    bind=_test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a DB session per test function.
    Uses SAVEPOINT-based rollback to isolate test writes.
    """
    async with _test_engine.connect() as conn:
        # Begin an outer transaction that will be rolled back
        await conn.begin()
        # Create a savepoint for nested transactions to work correctly
        session = AsyncSession(bind=conn, expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
            # Roll back the outer transaction — undoes all test writes
            await conn.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    HTTP test client with the DB dependency overridden to use the test session.
    """
    async def override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app),
        base_url="http://testserver",
    ) as ac:
        yield ac

    fastapi_app.dependency_overrides.clear()
