from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from .config.settings import get_settings
from .config.database import async_engine, Base
from .core.middleware import add_middlewares
from .core.exceptions import add_exception_handlers
from .api.v1.router import api_router

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
  # Startup
  print("🚀 Starting up...")
  
  # Create database tables
  async with async_engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)
  
  print("✅ Database tables created")
  yield
  
  # Shutdown
  print("🛑 Shutting down...")
  await async_engine.dispose()
  print("✅ Cleanup completed")


# FastAPI Application
app = FastAPI(
  title=settings.app_name,
  version=settings.app_version,
  description="FastAPI + MySQL + NextJS Application",
  lifespan=lifespan,
  docs_url="/docs" if settings.debug else None,
  redoc_url="/redoc" if settings.debug else None,
)

# CORS Middleware
app.add_middleware(
  CORSMiddleware,
  allow_origins=settings.cors_origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Add custom middlewares
add_middlewares(app)

# Add exception handlers
add_exception_handlers(app)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


# Health check endpoint
@app.get("/health")
async def health_check():
  return JSONResponse(
    content={
      "status": "healthy",
      "app": settings.app_name,
      "version": settings.app_version,
      "environment": settings.environment
    }
  )


# Root endpoint
@app.get("/")
async def root():
  return JSONResponse(
    content={
      "message": f"Welcome to {settings.app_name}",
      "version": settings.app_version,
      "docs": "/docs" if settings.debug else "Documentation disabled in production"
    }
  )