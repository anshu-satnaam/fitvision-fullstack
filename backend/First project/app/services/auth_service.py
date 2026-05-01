"""
Authentication service — password hashing, JWT token management, reset tokens.
"""

import uuid
from typing import Optional
import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password Hashing ─────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Tokens ────────────────────────────────────────────────

def create_access_token(user_id: str, expires_delta: timedelta = None) -> str:
    """Create a JWT access token for the given user."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """
    Decode a JWT access token and return the user_id string.
    Returns None if the token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str   = payload.get("sub")
        return user_id_str
    except (JWTError, ValueError):
        return None


# ── Password Reset Tokens ────────────────────────────────────

def generate_reset_token() -> tuple[str, datetime]:
    """
    Generate a secure random reset token and its expiration time.
    Returns (token, expires_at).
    """
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
    )
    return token, expires_at


def verify_reset_token_expiry(expires_at: datetime) -> bool:
    """Check if a reset token is still valid (not expired)."""
    return datetime.now(timezone.utc) < expires_at
