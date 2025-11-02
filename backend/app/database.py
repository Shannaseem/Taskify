from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pydantic_settings import BaseSettings
import os

# --- Environment Settings ---
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/taskify_db"

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

settings = Settings()

# --- Database Connection Setup (UPGRADED) ---

# create_engine is now configured with a connection pool.
# This is critical for production and handling "multiple cores".
engine = create_engine(
    settings.DATABASE_URL,
    
    # --- Production-Grade Pooling ---
    # pool_size: The number of permanent connections to keep open in the pool.
    # We set this to 5 as a safe default.
    pool_size=5, 
    
    # max_overflow: The number of "extra" connections allowed during a usage spike.
    # This allows 10 (5 + 10 = 15 total) connections during a busy time.
    max_overflow=10,
    
    # pool_recycle: Automatically recycle connections after 3600 seconds (1 hour)
    # to prevent stale connections from building up.
    pool_recycle=3600,
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Re-use the Base from your models.py file
Base = declarative_base()


# --- Dependency for FastAPI ---
def get_db():
    """
    FastAPI dependency to get a database session per request.
    This now pulls a connection from our efficient pool.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
