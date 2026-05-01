"""
FastAPI application entry point.
Configures CORS, includes all routers, and sets up startup events.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import get_settings
from app.database import init_db
from app.services.gamification_service import seed_badges

# Import all routers
from app.routers import (
    auth,
    totp,
    profile,
    workouts,
    water,
    routines,
    badges,
    dashboard,
    social,
    chat,
    workout_plans,
)
from app.chatbot import router as chatbot_router
from app.routers import fitvision_adapter, legacy_chatbot, legacy_websocket, ai, duel

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Initialize MongoDB via Beanie
    await init_db()

    # Seed default badges
    await seed_badges()

    yield


app = FastAPI(
    title="Fitness Backend API",
    description="A comprehensive fitness tracking backend with workouts, gamification, social features, and real-time chat.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Middleware ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files (avatar uploads) ────────────────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# ── Include Routers under /api ───────────────────────────────────────────────
api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(totp.router)
api_router.include_router(profile.router)
api_router.include_router(workouts.router)
api_router.include_router(water.router)
api_router.include_router(routines.router)
api_router.include_router(badges.router)
api_router.include_router(dashboard.router)
api_router.include_router(social.router)
api_router.include_router(chat.router)
api_router.include_router(workout_plans.router)
api_router.include_router(chatbot_router.router)
api_router.include_router(fitvision_adapter.router)
api_router.include_router(legacy_chatbot.router)
api_router.include_router(legacy_websocket.router)
api_router.include_router(ai.router)
api_router.include_router(duel.router)

@api_router.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "Fitness Backend API"}

app.include_router(api_router)


# ── Frontend SPA Catch-All ───────────────────────────────────────────────────
# Mount Vite's dist folder
FRONTEND_DIST = "../../dist"
os.makedirs(FRONTEND_DIST, exist_ok=True)
app.mount("/assets", StaticFiles(directory=f"{FRONTEND_DIST}/assets"), name="assets")

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    """Serve the React SPA for all unknown routes, allowing client-side routing."""
    filepath = os.path.join(FRONTEND_DIST, full_path)
    if os.path.isfile(filepath):
        return FileResponse(filepath)
    return FileResponse(f"{FRONTEND_DIST}/index.html")
