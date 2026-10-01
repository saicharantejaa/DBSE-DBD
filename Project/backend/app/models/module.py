"""
app/models/module.py
ORM model for the `modules` table.
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from app.db.postgres import Base


class Module(Base):
    __tablename__ = "modules"

    id          = Column(Integer, primary_key=True, index=True)
    course_id   = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    title       = Column(String(150), nullable=False)
    order_index = Column(Integer, default=0)
    created_at  = Column(DateTime, server_default=func.now())
