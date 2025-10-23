from app.database import engine
from sqlalchemy import text

def check_tables():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """))
        tables = [row[0] for row in result]
        print("Tables existantes:", tables)

if __name__ == "__main__":
    check_tables()