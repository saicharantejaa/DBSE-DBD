"""
app/schemas/user.py
Pydantic request / response models for users.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserOut(BaseModel):
    id:         int
    name:       str
    email:      str
    role:       UserRole
    created_at: Optional[datetime] = None

    # Computed helper fields expected by the frontend
    avatar: Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_avatar(cls, user) -> "UserOut":
        obj = cls.model_validate(user)
        # Build initials avatar (matches mock API shape: "RK", "AS" etc.)
        parts = user.name.split()
        obj.avatar = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else parts[0][:2].upper()
        return obj
