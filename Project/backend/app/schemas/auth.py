"""
app/schemas/auth.py
Pydantic request / response models for authentication endpoints.
"""
from pydantic import BaseModel, EmailStr

from app.models.user import UserRole
from app.schemas.user import UserOut


class RegisterRequest(BaseModel):
    name:     str
    email:    EmailStr
    password: str
    role:     UserRole = UserRole.student


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut
