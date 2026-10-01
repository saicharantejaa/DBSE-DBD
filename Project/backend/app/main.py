"""
app/main.py
FastAPI application entry point.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.mongo import close_mongo
from app.routers import auth, courses, doubts, enrollments, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing extra needed (SQLAlchemy engine created lazily)
    yield
    # Shutdown: close Motor connection
    await close_mongo()


app = FastAPI(
    title="LearnAI Platform API",
    description=(
        "Real FastAPI backend for the LearnAI learning platform. "
        "Replaces mock-api/ with PostgreSQL (SQLAlchemy + pgvector) and MongoDB (Motor). "
        "CO1: SQL trigger, stored procedure, view. "
        "CO2: pgvector semantic search + MongoDB integration. "
        "CO3: layered FastAPI architecture with JWT auth + RBAC."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the Vite dev server (port 5173) and any localhost origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(enrollments.router)
app.include_router(doubts.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/", tags=["meta"])
async def root():
    return {
        "message": "LearnAI Platform API is running",
        "docs": "/docs",
        "redoc": "/redoc",
    }
