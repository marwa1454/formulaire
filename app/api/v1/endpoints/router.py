from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.schemas import SignalementCreate, SignalementResponse, SignalementUpdate
from app.services.crud import crud_signalement
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=SignalementResponse, status_code=201)
def create_signalement(
    signalement: SignalementCreate,
    db: Session = Depends(get_db)
):
    """Créer un nouveau signalement"""
    return crud_signalement.create_signalement(db=db, signalement=signalement)

@router.get("/", response_model=List[SignalementResponse])
def list_signalements(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à sauter"),
    limit: int = Query(100, ge=1, le=500, description="Nombre max d'éléments"),
    type_evenement: Optional[str] = Query(None, description="Filtrer par type"),
    gravite: Optional[str] = Query(None, description="Filtrer par gravité"),
    nom_agent: Optional[str] = Query(None, description="Filtrer par nom d'agent"),
    source_information: Optional[str] = Query(None, description="Filtrer par source"),
    date_debut: Optional[date] = Query(None, description="Date de début (YYYY-MM-DD)"),
    date_fin: Optional[date] = Query(None, description="Date de fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Liste tous les signalements avec pagination et filtres optionnels.
    
    Retourne également le nombre total dans les headers.
    """
    # Compter le total
    total = crud_signalement.count_signalements(
        db=db,
        type_evenement=type_evenement,
        gravite=gravite,
        nom_agent=nom_agent,
        source_information=source_information,
        date_debut=date_debut,
        date_fin=date_fin
    )
    
    # Récupérer les signalements
    signalements = crud_signalement.get_signalements(
        db=db,
        skip=skip,
        limit=limit,
        type_evenement=type_evenement,
        gravite=gravite,
        nom_agent=nom_agent,
        source_information=source_information,
        date_debut=date_debut,
        date_fin=date_fin
    )
    
    # Note: Pour retourner le total dans un header, vous pouvez utiliser Response
    # from fastapi import Response
    # response.headers["X-Total-Count"] = str(total)
    
    return signalements

@router.get("/statistiques")
def get_statistiques(db: Session = Depends(get_db)):
    """
    Statistiques complètes des signalements.
    
    Retourne le total, répartition par type, par gravité, 
    et statistiques temporelles (aujourd'hui, semaine, mois).
    """
    return crud_signalement.get_signalements_stats(db=db)

@router.get("/recent")
def get_recent_signalements(
    days: int = Query(7, ge=1, le=90, description="Nombre de jours"),
    limit: int = Query(20, ge=1, le=100, description="Nombre max de résultats"),
    db: Session = Depends(get_db)
):
    """Signalements des X derniers jours"""
    return crud_signalement.get_recent_signalements(db=db, days=days, limit=limit)

@router.get("/search")
def search_signalements(
    q: str = Query(..., min_length=2, description="Terme de recherche"),
    limit: int = Query(50, ge=1, le=200, description="Nombre max de résultats"),
    db: Session = Depends(get_db)
):
    """Recherche par mot-clé dans lieu, commentaires et agents"""
    return crud_signalement.search_signalements(db=db, search_term=q, limit=limit)

@router.get("/agent/{id_agent}", response_model=List[SignalementResponse])
def get_signalements_by_agent(
    id_agent: str,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Tous les signalements d'un agent spécifique"""
    return crud_signalement.get_signalements_by_agent(db=db, id_agent=id_agent, limit=limit)

@router.get("/{signalement_id}", response_model=SignalementResponse)
def get_signalement(
    signalement_id: int,
    db: Session = Depends(get_db)
):
    """Détails d'un signalement spécifique"""
    signalement = crud_signalement.get_signalement(db=db, signalement_id=signalement_id)
    if not signalement:
        raise HTTPException(status_code=404, detail="Signalement non trouvé")
    return signalement

@router.put("/{signalement_id}", response_model=SignalementResponse)
def update_signalement(
    signalement_id: int,
    signalement: SignalementUpdate,
    db: Session = Depends(get_db)
):
    """Mettre à jour un signalement"""
    updated = crud_signalement.update_signalement(
        db=db,
        signalement_id=signalement_id,
        signalement_update=signalement
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Signalement non trouvé")
    return updated

@router.delete("/{signalement_id}")
def delete_signalement(
    signalement_id: int,
    db: Session = Depends(get_db)
):
    """Supprimer un signalement"""
    deleted = crud_signalement.delete_signalement(db=db, signalement_id=signalement_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Signalement non trouvé")
    return {"message": "Signalement supprimé avec succès", "id": signalement_id}