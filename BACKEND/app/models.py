from app.db.base import Base
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

class Role(enum.Enum):
    user = "user"
    admin = "admin"
    
class Priority(enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"

class Status(enum.Enum):
    pending = "pending"
    completed = "completed"
    in_progress = "in_progress"
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4,nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String(50), default=Role.user.value, nullable=False)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tasks = relationship("Task", back_populates="owner")
    is_deleted = Column(Boolean, default=False)
    token_version = Column(Integer, default=1, nullable=False)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default=Status.pending.value)
    priority = Column(String, default=Priority.medium.value) 

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    owner = relationship("User", back_populates="tasks")

    created_at = Column(DateTime, default=datetime.utcnow)