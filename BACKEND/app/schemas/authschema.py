from pydantic import BaseModel, EmailStr,field_validator
from uuid import UUID
import re

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    @field_validator("password")
    def validate_password(cls, value):
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Must include uppercase letter")
        if not re.search(r"[0-9]", value):
            raise ValueError("Must include number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_]', value):
            raise ValueError("Must include special character")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str


from datetime import datetime
class UserOut(BaseModel):
    id: UUID
    email: str
    role: str
    full_name: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
class UserLoginOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserOut
class AllUsers(BaseModel):
    total: int
    page: int
    limit: int
    data: list[UserOut]
class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    @field_validator("new_password")
    def validate_password(cls, value):
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Must include uppercase letter")
        if not re.search(r"[0-9]", value):
            raise ValueError("Must include number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_]', value):
            raise ValueError("Must include special character")
        return value
    @field_validator("current_password")
    def validate_current_password(cls, value):
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Must include uppercase letter")
        if not re.search(r"[0-9]", value):
            raise ValueError("Must include number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_]', value):
            raise ValueError("Must include special character")
        return value

class RefreshToken(BaseModel):
    refresh_token: str