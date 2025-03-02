from __future__ import annotations
from typing import Optional, List, Dict, Any
from datetime import datetime

from pydantic import BaseModel, Field, EmailStr


class AgentResponse(BaseModel):
    summary: str


class UserRequest(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    email: EmailStr = Field(max_length=200)
    password: str = Field(min_length=6, max_length=50)


class UserResponse(BaseModel):
    id: int
    name: str = Field()
    email: EmailStr = Field()
    is_admin: bool = Field()
    is_verified: bool = Field()
    verification_code_expires: datetime | None = Field(None)
    reset_password_code_expires: datetime | None = Field(None)

    class Config: from_attributes = True


class UserVerificationRequest(BaseModel):
    code: str


class UpdateUserRequest(BaseModel):
    name: str


class AccessTokenResponse(BaseModel):
    access_token: str = Field()
    access_token_expiry: datetime = Field()
    token_type: str = Field()
    

class DualTokenResponse(BaseModel):
    access_token: str = Field()
    refresh_token: str = Field()

    access_token_expiry: datetime = Field()
    refresh_token_expiry: datetime = Field()
    token_type: str = Field()


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ResetPasswordRequest(BaseModel):
    code: str
    new_password: str


class ConversationUpdate(BaseModel):
    id: int
    name: Optional[str] = None
    context: Optional[str] = None
    transcript: Optional[List[Dict[str, Any]]] = None
    summary: Optional[str] = None
    

class ConversationResponse(BaseModel):
    id: int
    user_id: int
    name: str
    transcript: List[Dict[str, Any]] | None = None
    summary: str = ""
    created_at: datetime
    updated_at: datetime

    class Config: 
        from_attributes = True


class PredictionResponse(BaseModel):
    text: str
    timestamp: float
    complete: bool = False
    new: bool = True
    error: bool = False
