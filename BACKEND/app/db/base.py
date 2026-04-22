from sqlalchemy.orm import declarative_base,sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings
DATABASE_URL = settings.DATABASE_URL

Base = declarative_base()
engine = create_engine(
    DATABASE_URL,
    echo=True,          # logs SQL queries (optional)
    future=True
)

# 2. Create session
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)