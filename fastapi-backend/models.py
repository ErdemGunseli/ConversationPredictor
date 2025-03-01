from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Boolean, JSON

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    
    name = Column(String, nullable=False)
    email = Column(String, index=True, unique=True, nullable=False)

    password = Column(String, nullable=True)
    oauth_provider = Column(String, nullable=True)

    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=True)

    verification_code = Column(String, nullable=True, index=True)
    verification_code_expires = Column(DateTime(timezone=True), nullable=True)

    reset_password_code = Column(String, nullable=True, index=True)
    reset_password_code_expires = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False, default="New Conversation")
    transcript = Column(JSON, nullable=True, default=[])
    summary = Column(String, nullable=True, default="")
    
    context = Column(String, nullable=True, default="")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    user = relationship("User", back_populates="conversations")


