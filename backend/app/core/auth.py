from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import TokenData

SECRET_KEY = getattr(settings, 'SECRET_KEY', "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Use HTTPBearer directly - it handles both sync and async properly
security = HTTPBearer(auto_error=False)

print("[DEBUG] HTTPBearer security initialized with auto_error=False")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type", "access")
        if email is None:
            return None
        return TokenData(email=email, token_type=token_type)
    except JWTError:
        return None

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()

def get_token_from_request(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = None) -> Optional[str]:
    """
    Extract token from either Authorization header (Bearer token) or access_token cookie.
    Priority: Bearer token > Cookie
    """
    # First try Bearer token from Authorization header
    if credentials and credentials.credentials:
        return credentials.credentials

    # Then try cookie
    access_token = request.cookies.get("access_token")
    if access_token:
        return access_token

    return None

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Try to get token from Bearer header or cookies
        token = get_token_from_request(request, credentials)

        if not token:
            print(f"[DEBUG] No token provided in Authorization header or cookies!")
            raise credentials_exception

        print(f"[DEBUG] Token (first 50 chars): {token[:50]}...")
        print(f"[DEBUG] Attempting to decode token")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"[DEBUG] Token decoded successfully")
        print(f"[DEBUG] Payload: {payload}")

        email: str = payload.get("sub")
        token_type: str = payload.get("type", "access")  # Default to "access" for backward compatibility
        print(f"[DEBUG] Email: {email}, Token Type: {token_type}")

        if email is None:
            print(f"[DEBUG] Email is None, raising exception")
            raise credentials_exception
        # Only accept access tokens (not refresh tokens)
        if token_type == "refresh":
            print(f"[DEBUG] Token is refresh token, rejecting for get_current_user")
            raise credentials_exception
        token_data = TokenData(email=email, token_type=token_type)
        print(f"[DEBUG] Token data created: {token_data}")
    except JWTError as e:
        print(f"[DEBUG] JWTError: {e}")
        raise credentials_exception

    print(f"[DEBUG] Looking up user by email: {email}")
    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        print(f"[DEBUG] User not found for email: {email}")
        raise credentials_exception
    print(f"[DEBUG] User found: {user.email}")
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
    if current_user.user_type not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def get_current_super_admin_user(current_user: User = Depends(get_current_active_user)):
    if current_user.user_type != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user