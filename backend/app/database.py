from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/urbansolver")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
)

# Session local
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for models
Base = declarative_base()

# Dependency
async def get_db():
    async with async_session() as session:
        yield session