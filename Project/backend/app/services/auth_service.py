"""
app/services/auth_service.py
Business logic for registration and login.
"""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories import user_repo
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserOut


async def register(db: AsyncSession, payload: RegisterRequest) -> TokenResponse:
    existing = await user_repo.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )
    pw_hash = hash_password(payload.password)
    user = await user_repo.create_user(
        db,
        name=payload.name,
        email=payload.email,
        password_hash=pw_hash,
        role=payload.role,
    )
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserOut.from_orm_with_avatar(user),
    )


async def login(db: AsyncSession, payload: LoginRequest) -> TokenResponse:
    user = await user_repo.get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserOut.from_orm_with_avatar(user),
    )
