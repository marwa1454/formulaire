from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, timedelta, date  
from app.models import Signalement
from app.schemas import SignalementCreate, SignalementUpdate

class SignalementCRUD:
    def create_signalement(self, db: Session, signalement: SignalementCreate) -> Signalement:
        db_signalement = Signalement(**signalement.model_dump())
        db.add(db_signalement)
        db.commit()
        db.refresh(db_signalement)
        return db_signalement
    
    def get_signalement(self, db: Session, signalement_id: int) -> Optional[Signalement]:
        return db.query(Signalement).filter(Signalement.id == signalement_id).first()
    
    def get_signalements(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        type_evenement: Optional[str] = None,
        gravite: Optional[str] = None,
        nom_agent: Optional[str] = None,
        source_information: Optional[str] = None,
        date_debut: Optional[date] = None,  # 👈 AJOUT
        date_fin: Optional[date] = None      # 👈 AJOUT
    ) -> List[Signalement]:
        query = db.query(Signalement)
       
        if type_evenement:
            query = query.filter(Signalement.type_evenement == type_evenement)
        if gravite:
            query = query.filter(Signalement.gravite == gravite)
        if nom_agent:
            query = query.filter(Signalement.nom_agent.ilike(f"%{nom_agent}%"))
        if source_information:
            query = query.filter(Signalement.source_information == source_information)
        
        # 👇 AJOUTS pour filtrage par date
        if date_debut:
            query = query.filter(Signalement.date_signalement >= date_debut)
        if date_fin:
            query = query.filter(Signalement.date_signalement <= date_fin)
           
        return query.order_by(Signalement.created_at.desc()).offset(skip).limit(limit).all()
    
    # 👇 NOUVELLE MÉTHODE : Compter le total (pour la pagination)
    def count_signalements(
        self,
        db: Session,
        type_evenement: Optional[str] = None,
        gravite: Optional[str] = None,
        nom_agent: Optional[str] = None,
        source_information: Optional[str] = None,
        date_debut: Optional[date] = None,
        date_fin: Optional[date] = None
    ) -> int:
        """Compte le nombre total de signalements (avec filtres)"""
        query = db.query(Signalement)
        
        if type_evenement:
            query = query.filter(Signalement.type_evenement == type_evenement)
        if gravite:
            query = query.filter(Signalement.gravite == gravite)
        if nom_agent:
            query = query.filter(Signalement.nom_agent.ilike(f"%{nom_agent}%"))
        if source_information:
            query = query.filter(Signalement.source_information == source_information)
        if date_debut:
            query = query.filter(Signalement.date_signalement >= date_debut)
        if date_fin:
            query = query.filter(Signalement.date_signalement <= date_fin)
        
        return query.count()
    
    def update_signalement(
        self,
        db: Session,
        signalement_id: int,
        signalement_update: SignalementUpdate
    ) -> Optional[Signalement]:
        db_signalement = self.get_signalement(db, signalement_id)
        if not db_signalement:
            return None
           
        update_data = signalement_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_signalement, field, value)
           
        db.commit()
        db.refresh(db_signalement)
        return db_signalement
    
    def delete_signalement(self, db: Session, signalement_id: int) -> bool:
        db_signalement = self.get_signalement(db, signalement_id)
        if not db_signalement:
            return False
           
        db.delete(db_signalement)
        db.commit()
        return True
    
    def get_signalements_stats(self, db: Session):
        """Statistiques des signalements"""
        total = db.query(Signalement).count()
        by_gravite = db.query(
            Signalement.gravite, 
            func.count(Signalement.id)
        ).group_by(Signalement.gravite).all()
        
        by_type = db.query(
            Signalement.type_evenement, 
            func.count(Signalement.id)
        ).group_by(Signalement.type_evenement).all()
        
        # 👇 AJOUT : Statistiques temporelles
        aujourdhui = datetime.now().date()
        hier = aujourdhui - timedelta(days=1)
        semaine = aujourdhui - timedelta(days=7)
        mois = aujourdhui - timedelta(days=30)
        
        stats_aujourdhui = db.query(Signalement).filter(
            Signalement.date_signalement == aujourdhui
        ).count()
        
        stats_hier = db.query(Signalement).filter(
            Signalement.date_signalement == hier
        ).count()
        
        stats_semaine = db.query(Signalement).filter(
            Signalement.date_signalement >= semaine
        ).count()
        
        stats_mois = db.query(Signalement).filter(
            Signalement.date_signalement >= mois
        ).count()
       
        return {
            "total": total,
            "par_gravite": dict(by_gravite),
            "par_type": dict(by_type),
            "aujourdhui": stats_aujourdhui,
            "hier": stats_hier,
            "cette_semaine": stats_semaine,
            "ce_mois": stats_mois
        }
    
    # 👇 NOUVELLE MÉTHODE : Recherche par mot-clé
    def search_signalements(
        self,
        db: Session,
        search_term: str,
        limit: int = 50
    ) -> List[Signalement]:
        """Recherche dans lieu, commentaires et nom d'agent"""
        return db.query(Signalement).filter(
            or_(
                Signalement.lieu.ilike(f"%{search_term}%"),
                Signalement.commentaire_complementaire.ilike(f"%{search_term}%"),
                Signalement.nom_agent.ilike(f"%{search_term}%"),
                Signalement.id_agent.ilike(f"%{search_term}%")
            )
        ).order_by(Signalement.created_at.desc()).limit(limit).all()
    
    # 👇 NOUVELLE MÉTHODE : Signalements récents
    def get_recent_signalements(
        self,
        db: Session,
        days: int = 7,
        limit: int = 20
    ) -> List[Signalement]:
        """Récupère les signalements des X derniers jours"""
        date_limite = datetime.now().date() - timedelta(days=days)
        return db.query(Signalement).filter(
            Signalement.date_signalement >= date_limite
        ).order_by(Signalement.created_at.desc()).limit(limit).all()
    
    # 👇 NOUVELLE MÉTHODE : Signalements par agent
    def get_signalements_by_agent(
        self,
        db: Session,
        id_agent: str,
        limit: int = 100
    ) -> List[Signalement]:
        """Tous les signalements d'un agent spécifique"""
        return db.query(Signalement).filter(
            Signalement.id_agent == id_agent
        ).order_by(Signalement.created_at.desc()).limit(limit).all()

crud_signalement = SignalementCRUD()