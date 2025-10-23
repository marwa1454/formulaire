from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import time

# Configuration de la base de données
DATABASE_URL = settings.database_url_formatted

engine = create_engine(
    DATABASE_URL,
    #echo=settings.debug,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={
        "connect_timeout": 10,  # Timeout de connexion
        "application_name": "event_form_api"
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_database_health(max_retries=5, retry_delay=2):
    """
    Vérifier la santé de la base de données avec retry automatique
    """
    for attempt in range(max_retries):
        try:
            print(f"Tentative de connexion {attempt + 1}/{max_retries}...")
            
            # Tenter une connexion et une requête simple
            with engine.connect() as connection:
                result = connection.execute(text("SELECT 1 as health_check"))
                row = result.fetchone()
                
                if row and row[0] == 1:
                    return {
                        "status": "healthy",
                        "message": f"Base de données accessible (tentative {attempt + 1})",
                        "database_url": DATABASE_URL.replace(settings.postgres_password, "***"),
                        "attempt": attempt + 1
                    }
        
        except Exception as e:
            print(f"Erreur tentative {attempt + 1}: {str(e)}")
            
            if attempt < max_retries - 1:
                print(f"Attente de {retry_delay} secondes avant nouvelle tentative...")
                time.sleep(retry_delay)
            else:
                return {
                    "status": "unhealthy", 
                    "message": f"Erreur après {max_retries} tentatives: {str(e)}",
                    "database_url": DATABASE_URL.replace(settings.postgres_password, "***"),
                    "attempts": max_retries
                }
    
    return {
        "status": "unhealthy",
        "message": "Échec après toutes les tentatives",
        "attempts": max_retries
    }