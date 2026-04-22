from fastapi import FastAPI
from sqlalchemy import text
from app.db.session import SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_v1_router as api_router
from app.middleware.authmiddleware import AuthMiddleware
from app.db.base import Base,engine
import time
from sqlalchemy.exc import OperationalError

app = FastAPI()

def init_db():
    for i in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ Tables created")
            return
        except OperationalError:
            print("⏳ DB not ready, retrying...")
            time.sleep(2)
    raise Exception("❌ Could not connect to DB")

@app.on_event("startup")
def startup():
    init_db()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthMiddleware)
app.include_router(api_router, prefix="/api/v1")
@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/health/db")
def db_health_check():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
    finally:
        db.close()