from fastapi import APIRouter
from app.api.v1.endpoints import auth, router

api_router = APIRouter()

# Inclure les routes des signalements
api_router.include_router(
    router,
    prefix="/signalements",
    tags=["signalements"]
)
# Router auth - AJOUT
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)
