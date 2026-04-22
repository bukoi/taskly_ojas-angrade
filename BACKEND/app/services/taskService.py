from app.schemas.taskSchema import TaskCreate, TaskUpdate, TaskAdminUpdate, TaskListResponse,TaskBulkUpdate,TaskBulkUpdateResponse
from app.models import Task
from app.models import User
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_,func
from typing import Optional
from fastapi import HTTPException

class TaskService:
    def create_task(self, task: TaskCreate, db: Session, current_user: User):
        db_task = Task(
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            owner_id=current_user.id
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    def get_task(self, task_id: UUID, db: Session, current_user: User):
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        if task.owner_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="You are not authorized to access this task")
        return task
    
    def get_tasks(
        self,
        db: Session,
        current_user: User,
        page: int = 1,
        limit: int = 20
    ):
        offset = (page - 1) * limit

        query = db.query(Task).filter(Task.owner_id == current_user.id)

        total = query.count()

        tasks = query.offset(offset).limit(limit).all()

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "data": tasks
        }
    def search_task(
        self,
        db: Session,
        current_user: User,
        query_text: str,
        page: int = 1,
        limit: int = 20
    ):
        offset = (page - 1) * limit

        # Search by title or description
        query = (
            db.query(Task)
            .filter(Task.owner_id == current_user.id)
            .filter(
                or_(
                    Task.title.ilike(f"%{query_text}%"),
                    Task.description.ilike(f"%{query_text}%")
                )
            )
        )

        total = query.count()
        tasks = query.offset(offset).limit(limit).all()

        return TaskListResponse(
            total=total,
            page=page,
            limit=limit,
            data=tasks
        )
    def filter_tasks(
        self,
        db: Session,
        current_user: User,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ):
        offset = (page - 1) * limit

        query = db.query(Task).filter(Task.owner_id == current_user.id)
        
        if status:
            query = query.filter(Task.status == status)
        if priority:
            query = query.filter(Task.priority == priority)
        
        total = query.count()
        tasks = query.offset(offset).limit(limit).all()

        return TaskListResponse(
            total=total,
            page=page,
            limit=limit,
            data=tasks
        )
        
    def update_task(self, task: TaskUpdate, db: Session, current_user: User):
        db_task = db.query(Task).filter(Task.id == task.task_id).first()
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
        if db_task.owner_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="You are not authorized to access this task")
        update_data = task.model_dump(exclude_unset=True, mode='json')
        for field, value in update_data.items():
            if field == "task_id":
                continue
            setattr(db_task, field, value)
        db.commit()
        db.refresh(db_task)
        return db_task
        
    
    def delete_task(self, task_id: UUID, db: Session, current_user: User):
        db_task = db.query(Task).filter(Task.id == task_id).first()
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
        if db_task.owner_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="You are not authorized to access this task")
        db.delete(db_task)
        db.commit()
        return {"message": "Task deleted successfully"}
    

    def task_stats(self, db: Session, current_user: User):
        stats = db.query(
            Task.status,
            func.count(Task.id)
        ).filter(
            Task.owner_id == current_user.id
        ).group_by(Task.status).all()

        return dict(stats)
    #admin
    def get_all_tasks_current_selected(self, db: Session, page: int = 1, limit: int = 20, owner_id: Optional[UUID] = None):
        offset = (page - 1) * limit
        
        if owner_id:
            owner = db.query(User).filter(User.id == owner_id).first()
            if not owner or owner.is_deleted:
                raise HTTPException(status_code=404, detail="User not found or deleted")

        query = db.query(Task).join(User, Task.owner_id == User.id).filter(User.is_deleted == False)
        if owner_id:
            query = query.filter(Task.owner_id == owner_id)
        total = query.count()
        tasks = query.order_by(Task.created_at.desc()).offset(offset).limit(limit).all()
        return TaskListResponse(
            total=total,
            page=page,
            limit=limit,
            data=tasks
        )
        
    def get_all_tasks(
        self,
        db: Session,
        page: int = 1,
        limit: int = 20
    ):
        offset = (page - 1) * limit

        query = db.query(Task).join(User).filter(User.is_deleted == False)

        total = query.count()

        tasks = (
            query
            .order_by(Task.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return TaskListResponse(
            total=total,
            page=page,
            limit=limit,
            data=tasks
        )
    def bulk_update_task(self, tasks: list[TaskAdminUpdate], db: Session):
        updated_tasks = []
        for task in tasks:
            db_task = db.query(Task).filter(Task.id == task.task_id).first()
            if not db_task:
                raise HTTPException(status_code=404, detail="Task not found")
            update_data = task.model_dump(exclude_unset=True, mode='json')
            for field, value in update_data.items():
                if field == "task_id":
                    continue
                setattr(db_task, field, value)
            updated_tasks.append(db_task)
        db.commit()
        for t in updated_tasks:
            db.refresh(t)
        return TaskBulkUpdateResponse(
            message="Successfully updated tasks",
            tasks=updated_tasks
        )
    def create_task_for_user(
        self,
        db: Session,
        task: TaskCreate,
        user_id: UUID
    ):
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.is_deleted:
            raise HTTPException(status_code=404, detail="User not found")
        db_task = Task(
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            owner_id=user_id
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task