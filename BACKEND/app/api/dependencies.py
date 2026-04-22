from fastapi import Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import User
import uuid

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    # Middleware already validated token — just read state
    state_user = getattr(request.state, "user", None)
    if not state_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user_id = uuid.UUID(state_user["user_id"])
    except (ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if user.is_deleted:
        raise HTTPException(status_code=401, detail="Account has been deleted")
    
    # Verify token version
    if state_user.get("token_version") != user.token_version:
        raise HTTPException(status_code=401, detail="Session expired due to security changes. Please log in again.")

    return user

def get_current_user_info(request: Request):
    state_user = getattr(request.state, "user", None)
    if not state_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return state_user