from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models import Priority,Status
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = Priority.medium.value
    status: Optional[str] = Status.pending.value

class TaskUpdate(BaseModel):
    task_id: UUID
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None

    class Config:
        from_attributes = True

class TaskAdminUpdate(BaseModel):
    task_id: UUID
    priority: Optional[Priority] = Priority.medium.value
    status: Optional[Status] = Status.pending.value

    class Config:
        from_attributes = True

class UserMin(BaseModel):
    id: UUID
    full_name: Optional[str] = None
    email: str

    class Config:
        from_attributes = True

class TaskOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    status: Status
    priority: Priority
    owner_id: UUID
    owner: Optional[UserMin] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: list[TaskOut]

class TaskBulkUpdate(BaseModel):
    tasks: list[TaskAdminUpdate]

class TaskBulkUpdateResponse(BaseModel):
    message: str
    tasks: list[TaskOut]