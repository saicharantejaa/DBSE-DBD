"""
app/repositories/embedding_repo.py
Raw database access for content_embeddings (pgvector).
CO2 Evidence: the similarity query uses the <=> (cosine distance) pgvector operator.
"""
from typing import List, Optional

import numpy as np
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content_embedding import ContentEmbedding
from app.models.course_content import CourseContent


async def upsert_embedding(
    db: AsyncSession,
    content_id: int,
    chunk_text: str,
    embedding: List[float],
) -> ContentEmbedding:
    """Insert or replace an embedding for a content_id."""
    # Remove old embedding for this content_id if it exists
    existing = await db.execute(
        select(ContentEmbedding).where(ContentEmbedding.content_id == content_id)
    )
    old = existing.scalar_one_or_none()
    if old:
        await db.delete(old)
        await db.flush()

    emb = ContentEmbedding(
        content_id=content_id,
        chunk_text=chunk_text,
        embedding=embedding,
    )
    db.add(emb)
    await db.flush()
    return emb


async def similarity_search(
    db: AsyncSession,
    query_vector: List[float],
    limit: int = 3,
) -> List[dict]:
    """
    CO2 Evidence: pgvector cosine similarity search.
    Uses the <=> operator (cosine distance) to order by similarity.
    Returns the top-k most relevant content chunks.
    """
    # We pass the vector as a string literal in the format pgvector expects.
    vec_str = "[" + ",".join(str(v) for v in query_vector) + "]"
    sql = text(
        """
        SELECT
            ce.id             AS embedding_id,
            ce.content_id,
            ce.chunk_text,
            cc.title          AS content_title,
            cc.content_type,
            m.title           AS module_title,
            (ce.embedding <=> CAST(:vec AS vector)) AS distance
        FROM content_embeddings ce
        JOIN course_content cc ON cc.id = ce.content_id
        JOIN modules m         ON m.id  = cc.module_id
        ORDER BY ce.embedding <=> CAST(:vec AS vector)
        LIMIT :lim
        """
    )
    result = await db.execute(sql, {"vec": vec_str, "lim": limit})
    rows = result.mappings().all()
    return [dict(r) for r in rows]
