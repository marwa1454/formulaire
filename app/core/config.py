# =====================================
# app/core/config.py - REMPLACEZ TOUT LE CONTENU
# =====================================

import os
from typing import List

class Settings:
    """Configuration simple de l'application"""
    
    # Configuration de l'application
    app_name: str = os.getenv("APP_NAME", "API Système de Signalement")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    debug: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Configuration du serveur
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    
    # Configuration PostgreSQL
    postgres_user: str = os.getenv("POSTGRES_USER", "username")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "password")
    postgres_server: str = os.getenv("POSTGRES_SERVER", "localhost")
    postgres_port: int = int(os.getenv("POSTGRES_PORT", "5432"))
    postgres_db: str = os.getenv("POSTGRES_DB", "event_db")
    
    # Configuration de la base de données
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # Configuration CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080", 
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "*"  # Pour le développement
    ]
    
    # Configuration de sécurité
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Configuration de logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    @property
    def database_url_formatted(self) -> str:
        """URL de base de données formatée"""
        # Si DATABASE_URL est définie dans .env, l'utiliser
        if self.database_url and "postgresql://" in self.database_url:
            return self.database_url
        
        # Sinon, construire à partir des composants
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}"

# Instance globale des paramètres
settings = Settings()

# Debug info
if settings.debug:
    print(f"🔧 Configuration chargée:")
    print(f"   - App: {settings.app_name} v{settings.app_version}")
    print(f"   - Debug: {settings.debug}")
    print(f"   - Database URL: postgresql://{settings.postgres_user}:***@{settings.postgres_server}:{settings.postgres_port}/{settings.postgres_db}")
    print(f"   - CORS origins: {len(settings.cors_origins)} autorisées")