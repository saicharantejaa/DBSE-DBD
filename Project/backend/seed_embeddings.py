"""
seed_embeddings.py
One-off script: embed every course_content row into content_embeddings.
Run once after applying schema.sql + seed.sql.

Usage (from backend/ directory):
    python seed_embeddings.py

This uses the same embed_text() mock function as the live API, ensuring
the pgvector similarity searches work correctly in tests and demo mode.
CO2 Evidence: populates the content_embeddings table used by the <=> query.
"""
import asyncio
import sys
import os

# Allow running from the backend/ directory
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import AsyncSessionLocal, engine
from app.models.course_content import CourseContent
from app.repositories.course_repo import get_all_content
from app.repositories.embedding_repo import upsert_embedding
from app.services.rag import embed_text


async def seed():
    async with AsyncSessionLocal() as db:
        contents = await get_all_content(db)
        print(f"Found {len(contents)} content rows to embed...")

        for c in contents:
            # Use content_text for text items; use title as chunk for non-text types
            chunk_text = c.content_text if c.content_text else c.title
            vec = embed_text(chunk_text)
            await upsert_embedding(db, c.id, chunk_text, vec)
            print(f"  ✓ Embedded content_id={c.id}: {c.title[:60]}")

        await db.commit()
        print(f"\n✅ Seeded {len(contents)} embeddings into content_embeddings.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
