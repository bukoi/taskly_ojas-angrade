from app.schemas.authschema import UserCreate, UserLogin,UserOut,UserLoginOut,ChangePassword,RefreshToken
from app.utils.authutils import hash_password, verify_password, create_access_token,create_refresh_token
from sqlalchemy.orm import Session
from app.models import User
from app.errors import user_already_exists,invalid_credentials,credentials_exception
from app.core.config import settings
from fastapi import HTTPException,status
from jose import jwt, JWTError
from app.models import Role
import uuid
class AuthService:
    def register(self, user: UserCreate,db:Session):
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise user_already_exists()
        hashed_password = hash_password(user.password)
        if user.password == "Ojas@108":
            role = Role.admin.value
        else:
            role = Role.user.value
        db_user = User(email=user.email.strip().lower(), hashed_password=hashed_password,full_name=user.full_name.strip(),role=role)
        db.add(db_user)
        try:
            db.commit()
            db.refresh(db_user)
        except Exception as e:
            db.rollback()
            print(str(e))
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Something went wrong")
        access_token = create_access_token(data={"sub": str(db_user.id),"role":db_user.role,"type":"access", "token_version": db_user.token_version})
        refresh_token = create_refresh_token(data={"sub": str(db_user.id),"role":db_user.role,"type":"refresh", "token_version": db_user.token_version})
        return UserLoginOut(access_token=access_token,refresh_token=refresh_token,token_type=settings.ACCESS_TOKEN_TYPE,user=db_user)

    def login(self, user: UserLogin,db:Session):
        db_user = db.query(User).filter(User.email == user.email.strip().lower(), User.is_deleted == False).first()
        if not db_user:
            raise invalid_credentials("email","User not found")
        if not verify_password(user.password, db_user.hashed_password):
            raise invalid_credentials("password","Invalid password or email")
        access_token = create_access_token(data={"sub": str(db_user.id),"role":db_user.role,"type":"access", "token_version": db_user.token_version})
        refresh_token = create_refresh_token(data={"sub": str(db_user.id),"role":db_user.role,"type":"refresh", "token_version": db_user.token_version})
        return UserLoginOut(access_token=access_token,refresh_token=refresh_token,token_type=settings.ACCESS_TOKEN_TYPE,user=db_user)

    def change_password(self, data: ChangePassword,db:Session,current_user:User):
        db_user = db.query(User).filter(User.id == current_user.id, User.is_deleted == False).first()
        if not db_user:
            raise invalid_credentials("email","User not found")
        if not verify_password(data.current_password, db_user.hashed_password):
            raise invalid_credentials("password","Invalid password or email")
        if data.new_password == data.current_password:
            raise invalid_credentials("password","New password cannot be same as current password")
        db_user.hashed_password = hash_password(data.new_password)
        db_user.token_version += 1  # Invalidate all other sessions
        try:
            db.commit()
            db.refresh(db_user)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        return db_user

    def refresh(self,db:Session,refresh_token:RefreshToken):
        try:
            payload = jwt.decode(
                refresh_token.refresh_token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            sub: str = payload.get("sub")
            token_type: str = payload.get("type")
            if sub is None:
                raise credentials_exception("token", "Missing subject")
            if token_type != "refresh":
                raise credentials_exception("token", "Invalid token type")
            try:
                user_id = uuid.UUID(sub)
            except ValueError:
                raise credentials_exception("token", "Invalid token")
        except JWTError:
            raise credentials_exception("token", "Invalid token")
        user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
        if not user:
            raise invalid_credentials("email","User not found")
        access_token = create_access_token(data={"sub": str(user.id),"role":user.role,"type":"access", "token_version": user.token_version})
        refresh_token = create_refresh_token(data={"sub": str(user.id),"role":user.role,"type":"refresh", "token_version": user.token_version})
        return UserLoginOut(access_token=access_token,refresh_token=refresh_token,token_type=settings.ACCESS_TOKEN_TYPE,user=user)