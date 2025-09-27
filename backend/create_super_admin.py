#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from passlib.context import CryptContext
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from datetime import datetime, timezone

# Create password hash
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
password_hash = pwd_context.hash("aitkh@123")

# Create database connection
engine = create_engine(settings.DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

try:
    # Check if super admin already exists
    result = db.execute(text("SELECT id FROM users WHERE email = 'superadmin@aitkh.com'")).fetchone()
    
    if not result:
        # Insert super admin user
        db.execute(text("""
            INSERT INTO users (email, password_hash, full_name, user_type, is_active, created_at)
            VALUES ('superadmin@aitkh.com', :password_hash, 'Super Admin', 'super_admin', true, :created_at)
        """), {
            'password_hash': password_hash,
            'created_at': datetime.now(timezone.utc)
        })
        db.commit()
        print("✅ Super admin created successfully!")
        print("   Email: superadmin@aitkh.com")
        print("   Password: aitkh@123")
    else:
        print("ℹ️ Super admin already exists")
        
except Exception as e:
    print(f"❌ Error creating super admin: {e}")
    db.rollback()
finally:
    db.close()