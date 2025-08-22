from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator  # 추가
from .settings import get_settings

settings = get_settings()

# Async Database Engine
async_engine = create_async_engine(
  settings.mysql_url,
  echo=settings.debug,
  pool_pre_ping=True,
  pool_recycle=3600
)

# Async Session
AsyncSessionLocal = async_sessionmaker(
  async_engine,
  class_=AsyncSession,
  expire_on_commit=False
)

# Sync Database Engine (for Alembic)
sync_engine = create_engine(
  settings.sync_mysql_url,
  echo=settings.debug,
  pool_pre_ping=True,
  pool_recycle=3600
)

# Sync Session (for Alembic)
SessionLocal = sessionmaker(
  autocommit=False,
  autoflush=False,
  bind=sync_engine
)

# Base Class for Models
Base = declarative_base()


# Dependency for async database sessions
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:  # 수정
  async with AsyncSessionLocal() as session:
    try:
      yield session
    except Exception:
      await session.rollback()
      raise
    finally:
      await session.close()


# Dependency for sync database sessions (if needed)
def get_sync_session():
  session = SessionLocal()
  try:
    yield session
  except Exception:
    session.rollback()
    raise
  finally:
    session.close()