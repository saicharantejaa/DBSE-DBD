"""
app/models/user.py
ORM model for the `users` table.
"""
import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Integer, String, func
from app.db.postgres import Base


class UserRole(str, enum.Enum):
    student = "student"
    instructor = "instructor"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)
    email         = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role          = Column(Enum(UserRole, name="user_role", create_type=False), nullable=False, default=UserRole.student)
    created_at    = Column(DateTime, server_default=func.now())
