"""
app/models/content_embedding.py
ORM model for the `content_embeddings` table (pgvector).

We use the pgvector SQLAlchemy integration for the VECTOR column type.
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, func
from pgvector.sqlalchemy import Vector
from app.db.postgres import Base


class ContentEmbedding(Base):
    __tablename__ = "content_embeddings"

    id         = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("course_content.id", ondelete="CASCADE"))
    chunk_text = Column(Text, nullable=False)
    embedding  = Column(Vector(1536))  # 1536-dim — matches OpenAI text-embedding-ada-002
    created_at = Column(DateTime, server_default=func.now())
