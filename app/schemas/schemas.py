import re
from pydantic import BaseModel, Field, validator
from datetime import date, time, datetime
from typing import Optional
from app.models.models import TypeEvenement, GraviteEvenement, SourceInformation, ActionEntreprise

class SignalementBase(BaseModel):
    date_signalement: date = Field(
    default_factory=lambda: datetime.now().date(),
    description="Date du signalement"
    )
    heure_signalement: time = Field(
        default_factory=lambda: datetime.now().time(),
        description="Heure du signalement"
    )
    nom_agent: str = Field(..., min_length=1, max_length=100, description="Nom de l'agent")
    id_agent: str = Field(..., min_length=1, max_length=50, description="ID de l'agent")
    type_evenement: TypeEvenement = Field(..., description="Type d'événement")
    gravite: GraviteEvenement = Field(..., description="Gravité")
    lieu: str = Field(..., min_length=1, max_length=200, description="Lieu")
    source_information: SourceInformation = Field(..., description="Source de l'information")
    source_autre: Optional[str] = Field(None, max_length=200, description="Précision si source = Autre")
    action_entreprise: ActionEntreprise = Field(..., description="Action entreprise")
    action_autre: Optional[str] = Field(None, max_length=200, description="Précision si action = Autre")
    commentaire_complementaire: Optional[str] = Field(None, description="Commentaire complémentaire")


    # Gardez les autres validateurs
    @validator('source_autre')
    def validate_source_autre(cls, v, values):
        if values.get('source_information') == SourceInformation.AUTRE and not v:
            raise ValueError('source_autre est requis quand source_information est "Autre"')
        return v

    @validator('action_autre')
    def validate_action_autre(cls, v, values):
        if values.get('action_entreprise') == ActionEntreprise.AUTRE and not v:
            raise ValueError('action_autre est requis quand action_entreprise est "Autre"')
        return v

class SignalementCreate(SignalementBase):
    pass

class SignalementUpdate(BaseModel):
    date_signalement: Optional[date] = None
    heure_signalement: Optional[time] = None
    nom_agent: Optional[str] = Field(None, min_length=1, max_length=100)
    id_agent: Optional[str] = Field(None, min_length=1, max_length=50)
    type_evenement: Optional[TypeEvenement] = None
    gravite: Optional[GraviteEvenement] = None
    lieu: Optional[str] = Field(None, min_length=1, max_length=200)
    source_information: Optional[SourceInformation] = None
    source_autre: Optional[str] = Field(None, max_length=200)
    action_entreprise: Optional[ActionEntreprise] = None
    action_autre: Optional[str] = Field(None, max_length=200)
    commentaire_complementaire: Optional[str] = None

class SignalementResponse(SignalementBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True