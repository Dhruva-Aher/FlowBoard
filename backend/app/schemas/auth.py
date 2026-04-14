from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        # Upper bound prevents DoS via intentionally huge inputs.
        # 1 000 characters is far beyond any legitimate password.
        if len(v) > 1000:
            raise ValueError("Password must not exceed 1000 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str | None
    is_active: bool

    model_config = {"from_attributes": True}
