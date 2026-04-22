from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models import User
from app.services.taskService import TaskService
from app.schemas.taskSchema import TaskCreate, TaskUpdate, TaskAdminUpdate, TaskListResponse, TaskOut, TaskBulkUpdate, TaskBulkUpdateResponse
from typing import Optional
import uuid

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"]
)

task_service = TaskService()

@router.post("/", response_model=TaskOut, summary="Create task", description="Create a new task for the currently authenticated user.")
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.create_task(task, db, current_user)

@router.post("/admin/create-task/{user_id}", response_model=TaskOut, summary="Admin create task for user", description="Create and assign a task directly to a specific user by their ID. Restricted to administrators.")
def create_task_for_user(
    user_id: uuid.UUID,
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Authorization check for admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create tasks for other users")
    return task_service.create_task_for_user(db, task, user_id)

@router.get("/", response_model=TaskListResponse, summary="List own tasks", description="Retrieve a paginated list of tasks owned by the currently authenticated user.")
def get_tasks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.get_tasks(db, current_user, page, limit)

@router.get("/all", response_model=TaskListResponse, summary="Global task feed", description="Retrieve tasks from all active users or a specific user. Restricted to administrators.")
def get_all_tasks(
    owner_id: Optional[uuid.UUID] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if owner_id:
        return task_service.get_all_tasks_current_selected(db, page, limit, owner_id)
    return task_service.get_all_tasks(db, page, limit)

@router.get("/search", response_model=TaskListResponse, summary="Search own tasks", description="Search through the current user's tasks by title or description.")
def search_task(
    query: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.search_task(db, current_user, query, page, limit)

@router.get("/filter", response_model=TaskListResponse, summary="Filter own tasks", description="Filter the current user's tasks by status or priority.")
def filter_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.filter_tasks(db, current_user, status, priority, page, limit)

@router.get("/stats", summary="Get own task stats", description="Retrieve completion statistics for the current user's tasks.")
def get_task_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.task_stats(db, current_user)

@router.get("/{task_id}", response_model=TaskOut, summary="Get task details", description="Retrieve full details of a specific task by its ID.")
def get_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.get_task(task_id, db, current_user)

@router.patch("/", response_model=TaskOut, summary="Update task", description="Modify an existing task's title, description, status, or priority.")
def update_task(
    task: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.update_task(task, db, current_user)

@router.delete("/{task_id}", summary="Delete task", description="Permanently remove a task from the system.")
def delete_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.delete_task(task_id, db, current_user)

@router.patch("/bulk-update", response_model=TaskBulkUpdateResponse, summary="Bulk update tasks", description="Update the status or priority of multiple tasks in a single request. Restricted to administrators.")
def bulk_update_task(
    data: TaskBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.bulk_update_task(data.tasks, db)
