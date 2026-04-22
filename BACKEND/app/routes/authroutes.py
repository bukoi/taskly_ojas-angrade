from fastapi import APIRouter, Depends, HTTPException, Response, Request
from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.authschema import UserCreate,UserLogin,ChangePassword,UserOut,UserLoginOut,RefreshToken
from app.services.authservice import AuthService
from sqlalchemy.orm import Session
from app.models import User
from app.core.config import settings
from app.api.dependencies import get_current_user_info

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

auth_service = AuthService()

def set_refresh_cookie(response: Response, refresh_token: str):
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=False,
    )
@router.post("/register", response_model=UserLoginOut, summary="Register a new user", description="Create a new user account and receive an access token and refresh token (set in cookie).")
def register(user: UserCreate, response: Response, db: Session = Depends(get_db)):
    result = auth_service.register(user, db)
    set_refresh_cookie(response, result.refresh_token)
    return result

@router.post("/login", response_model=UserLoginOut, summary="User login", description="Authenticate with email and password to receive an access token and refresh token (set in cookie).")
def login(user: UserLogin, response: Response, db: Session = Depends(get_db)):
    result = auth_service.login(user, db)
    set_refresh_cookie(response, result.refresh_token)
    return result

@router.post("/logout", summary="Log out", description="Clear the refresh token cookie and invalidate the current session.")
def logout(response: Response):
    response.delete_cookie("refresh_token", httponly=True, samesite="lax")
    return {"message": "Successfully logged out"}

@router.post("/refresh", response_model=UserLoginOut, summary="Refresh access token", description="Use the refresh token stored in the cookie to obtain a new access token.")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    result = auth_service.refresh(db, RefreshToken(refresh_token=refresh_token))
    set_refresh_cookie(response, result.refresh_token)
    return result

@router.post("/change-password", response_model=UserOut, summary="Change password", description="Update the password for the currently authenticated user.")
def reset_password(data: ChangePassword, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return auth_service.change_password(data, db, current_user)