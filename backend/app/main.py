from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .database import engine, Base
from .routers import reports, issues, projects, ai
from .ai.rag import initialize_rag_with_gov_documents

app = FastAPI(
    title="UrbanSolver API",
    description="AI-powered civic infrastructure intelligence platform",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(reports.router)
app.include_router(issues.router)
app.include_router(projects.router)
app.include_router(ai.router)


@app.on_event("startup")
async def startup():
    # Create tables if they don't exist
    # In production, use Alembic migrations
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize RAG with sample documents
    await initialize_rag_with_gov_documents()


@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()


@app.get("/")
async def root():
    return {
        "message": "UrbanSolver API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}