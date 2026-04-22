from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import User,Task
from app.schemas.authschema import AllUsers
from sqlalchemy import or_,func
import uuid
class UserService:
    def get_users(self, db: Session, current_user: User, page: int, limit: int):
        total = db.query(User).filter(User.is_deleted == False).count()
        users = db.query(User).filter(User.is_deleted == False).offset((page - 1) * limit).limit(limit).all()
        return AllUsers(total=total, page=page, limit=limit, data=users)
    
    def delete_user(self, user_id: uuid.UUID, db: Session, current_user: User):
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        if str(db_user.id) == str(current_user.id):
            raise HTTPException(status_code=400, detail="You cannot delete yourself")
        if db_user.is_deleted:
            raise HTTPException(status_code=400, detail="User already deleted")
        db_user.is_deleted = True
        db.commit()
        return {"message": "User deleted successfully"}

    def search_user(self, query: str, db: Session, current_user: User,page:int,limit:int):
        query = db.query(User).filter(or_(User.email.ilike(f"%{query}%"),User.full_name.ilike(f"%{query}%")),User.is_deleted==False).offset((page-1)*limit).limit(limit)
        users=query.all()
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        total = query.count()
        return AllUsers(total=total,page=page,limit=limit,data=users)
    def bulk_delete_user(self, user_ids: list[uuid.UUID], db: Session, current_user: User):
        for user_id in user_ids:
            db_user = db.query(User).filter(User.id == user_id).first()
            if not db_user:
                continue  # Or raise error if you prefer strict
            if str(db_user.id) == str(current_user.id):
                continue # Skip self deletion in bulk
            if db_user.is_deleted:
                continue
            db_user.is_deleted = True
        db.commit()
        return {"message": "Users deleted successfully"}
    
    def update_role(self, user_id: uuid.UUID, role: str, db: Session):
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(404, "User not found")
        
        if user.is_deleted:
            raise HTTPException(400, "Cannot update role of a deleted user")

        user.role = role
        user.token_version += 1  # Invalidate existing tokens
        db.commit()

        return {"message": "Role updated and existing sessions invalidated"}

    def get_user_stats(self, db: Session):
        total_users = db.query(User).filter(User.is_deleted == False).count()
        admins = db.query(User).filter(User.role == "admin", User.is_deleted == False).count()
        regular_users = total_users - admins
        
        # Only count tasks from active (non-deleted) users
        task_query = db.query(Task).join(User, Task.owner_id == User.id).filter(User.is_deleted == False)
        total_tasks = task_query.count()
        completed_tasks = task_query.filter(Task.status == "completed").count()
        
        return {
            "total_users": total_users,
            "admins": admins,
            "regular_users": regular_users,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks
        }