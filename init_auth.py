#!/usr/bin/env python3
"""
Script pour initialiser l'authentification avec les rôles USER et ADMIN
Version avec bcrypt directement (sans passlib)
"""

import sys
import os

# Ajouter le chemin du projet
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
import bcrypt  # Utiliser bcrypt directement
from app.database import engine, Base, SessionLocal
from app.models.models import User


def create_users_table():
    """Créer la table users dans PostgreSQL"""
    print("🔧 Création de la table 'users'...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Table 'users' créée avec succès!")
        return True
    except Exception as e:
        print(f"❌ Erreur lors de la création de la table: {e}")
        return False


def hash_password(password: str) -> str:
    """Hash un mot de passe avec bcrypt"""
    # Convertir en bytes et hasher
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Retourner en string
    return hashed.decode('utf-8')


def create_user(db: Session, username: str, password: str, role: str = "USER"):
    """Crée un utilisateur dans la base de données"""
    
    # Vérifier si l'utilisateur existe déjà
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        print(f"⚠️  L'utilisateur '{username}' existe déjà (ignoré)")
        return None
    
    # Hasher le mot de passe
    hashed_password = hash_password(password)
    
    # Créer l'utilisateur
    user = User(
        username=username,
        hashed_password=hashed_password,
        role=role,
        is_active=True
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    print(f"✅ Utilisateur créé : {username} (Role: {role})")
    return user


def main():
    """Initialisation complète"""
    print("="*60)
    print("🚀 INITIALISATION DU SYSTÈME D'AUTHENTIFICATION")
    print("="*60)
    print()
    
    # Étape 1: Créer la table
    if not create_users_table():
        print("\n❌ Impossible de continuer sans la table users")
        return
    
    print()
    
    # Étape 2: Créer les utilisateurs
    db = SessionLocal()
    
    try:
        print("👥 Création des comptes utilisateurs...")
        print()
        
        # Créer le compte USER (formulaire seulement)
        create_user(
            db, 
            username="user", 
            password="user123", 
            role="USER"
        )
        
        # Créer le compte ADMIN (formulaire + dashboard)
        create_user(
            db, 
            username="admin", 
            password="admin123", 
            role="ADMIN"
        )
        
        print()
        print("="*60)
        print("✅ INITIALISATION TERMINÉE AVEC SUCCÈS!")
        print("="*60)
        print()
        print("📋 Identifiants créés:")
        print()
        print("   👤 USER (formulaire seulement):")
        print("      Username: user")
        print("      Password: user123")
        print("      Rôle: USER")
        print()
        print("   👑 ADMIN (formulaire + dashboard):")
        print("      Username: admin")
        print("      Password: admin123")
        print("      Rôle: ADMIN")
        print()
        print("🔗 Testez la connexion:")
        print("   http://localhost:8000/docs")
        print("   → Endpoint: POST /api/v1/auth/login")
        print()
        print("💡 Frontend:")
        print("   - Connectez-vous avec 'user' → Voit le formulaire")
        print("   - Connectez-vous avec 'admin' → Voit formulaire + dashboard")
        print()
        
    except Exception as e:
        print(f"\n❌ Erreur : {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()