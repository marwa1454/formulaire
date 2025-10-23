from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.app_name,
    description="API pour le système de signalement - République de Djibouti",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc"
)

print(f"🔧 CORS Origins: {settings.cors_origins}")
print(f"🔧 CORS Credentials: {'*' not in settings.cors_origins}")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure le routeur principal API v1
if api_router is not None:
    app.include_router(api_router, prefix="/api/v1")
    print("✅ Routeurs API inclus")
else:
    print("⚠️ Routeurs API non inclus - mode minimal")

@app.get("/")
def read_root():
    return {
        "message": settings.app_name, 
        "version": settings.app_version,
        "docs": "/docs",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "message": "API Système de Signalement",
        "version": settings.app_version
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)