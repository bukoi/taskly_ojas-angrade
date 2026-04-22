from fastapi import APIRouter
from app.routes.authroutes import router as auth_router
from app.routes.userRoutes import router as user_router
from app.routes.TaskRoutes import router as task_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(user_router)
api_v1_router.include_router(task_router)
