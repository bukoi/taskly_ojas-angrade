from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models import User
from app.services.userService import UserService
from app.schemas.authschema import AllUsers
import uuid

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

user_service = UserService()

@router.get("/", response_model=AllUsers, summary="List users", description="Retrieve a paginated list of active users. Administrators can see all users, while regular users have restricted access.")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return user_service.get_users(db, current_user, page, limit)

@router.delete("/{user_id}", summary="Delete user", description="Soft-delete a user account by its ID. Only administrators can perform this action.")
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return user_service.delete_user(user_id, db, current_user)

@router.get("/search", response_model=AllUsers, summary="Search users", description="Search for users by name or email with pagination support.")
def search_user(
    query: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return user_service.search_user(query, db, current_user, page, limit)

@router.post("/bulk-delete", summary="Bulk delete users", description="Soft-delete multiple user accounts simultaneously. Only administrators can perform this action.")
def bulk_delete_user(
    user_ids: list[uuid.UUID],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return user_service.bulk_delete_user(user_ids, db, current_user)

@router.patch("/{user_id}/role", summary="Update user role", description="Change a user's role (e.g., from 'user' to 'admin'). Only administrators can perform this action.")
def update_role(
    user_id: uuid.UUID,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return user_service.update_role(user_id, role, db)

@router.get("/stats", summary="Get user statistics", description="Retrieve high-level system analytics including user counts and task completion rates. Restricted to administrators.")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(403, "Only admins can view stats")
    return user_service.get_user_stats(db)
