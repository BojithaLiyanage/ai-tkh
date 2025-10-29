#!/usr/bin/env python3
"""Run the chatbot table migration"""

import psycopg
from app.core.config import settings

def run_migration():
    # Read the SQL file
    with open('update_chatbot_table.sql', 'r') as f:
        sql = f.read()

    # Connect to database
    # Convert SQLAlchemy URL to psycopg format
    db_url = settings.DATABASE_URL.replace('postgresql+psycopg://', 'postgresql://')

    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                print("Executing migration...")
                cur.execute(sql)
                conn.commit()
                print("Migration completed successfully!")
    except Exception as e:
        print(f"Error running migration: {e}")
        raise

if __name__ == "__main__":
    run_migration()
