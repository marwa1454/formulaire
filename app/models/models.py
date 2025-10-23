from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum as SQLEnum, Text, Date, Time
from sqlalchemy.sql import func
from app.database import Base
import enum


class TypeEvenement(enum.Enum):
    REUNION_QUARTIER = "Réunion de quartier"
    PUBLICATION_RESEAUX = "Publication sur les réseaux"
    RASSEMBLEMENT_PUBLIC = "Rassemblement public"
    AUTRE = "Autre"

class GraviteEvenement(enum.Enum):
    FAIBLE = "Faible"
    MOYENNE = "Moyenne"
    ELEVEE = "Élevée"

class SourceInformation(enum.Enum):
    OBSERVATION_DIRECTE = "Observation directe"
    INFORMATEUR = "Informateur"
    RESEAUX_SOCIAUX = "Réseaux sociaux"
    AUTRE = "Autre"

class ActionEntreprise(enum.Enum):
    OBSERVATION = "Observation"
    ALERTE_TRANSMISE = "Alerte transmise"
    INTERVENTION = "Intervention"
    AUTRE = "Autre"

class Signalement(Base):
    __tablename__ = "signalements"

    id = Column(Integer, primary_key=True, index=True)
    
    # Date et heure séparées comme dans le frontend
    date_signalement = Column(Date, nullable=False, default=func.current_date())  # ← Correction
    heure_signalement = Column(Time, nullable=False, default=func.current_time())  # ← Correction
    
    # Informations agent
    nom_agent = Column(String(100), nullable=False)
    id_agent = Column(String(50), nullable=False)
    
    # Détails de l'événement
    type_evenement = Column(SQLEnum(TypeEvenement), nullable=False)
    gravite = Column(SQLEnum(GraviteEvenement), nullable=False)
    lieu = Column(String(200), nullable=False)
    
    # Source et action
    source_information = Column(SQLEnum(SourceInformation), nullable=False)
    source_autre = Column(String(200), nullable=True)  # Pour "Autre" source
    action_entreprise = Column(SQLEnum(ActionEntreprise), nullable=False)
    action_autre = Column(String(200), nullable=True)  # Pour "Autre" action
    
    # Commentaire
    commentaire_complementaire = Column(Text, nullable=True)
    
    # Métadonnées automatiques
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())



class User(Base):
    """Modèle pour les utilisateurs (authentification)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="USER")
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<User(username='{self.username}', role='{self.role}')>"