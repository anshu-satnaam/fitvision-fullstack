"""
Authentication routes — register, login, password management.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)
from app.schemas.user import AuthResponse, UserResponse
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    generate_reset_token,
    verify_reset_token_expiry,
)
from app.services.totp_service import verify_totp

router = APIRouter(prefix="", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """Create a new user account."""
    # Check if username exists
    if await User.find_one(User.username == request.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    # Check if email exists
    if await User.find_one(User.email == request.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create user
    user = User(
        username=request.username,
        email=request.email,
        hashed_password=hash_password(request.password),
    )
    await user.insert()

    # Generate token
    token = create_access_token(str(user.id))

    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Authenticate user, update streak if first login of the day, and return access token."""
    from datetime import datetime, timezone, timedelta
    
    user = await User.find_one(User.username == request.username)

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    
    if user.last_login_date:
        last_login_start = datetime(user.last_login_date.year, user.last_login_date.month, user.last_login_date.day, tzinfo=timezone.utc)
        if last_login_start < today_start:
            # It's a new day! Check if it was exactly yesterday
            yesterday_start = today_start - timedelta(days=1)
            if last_login_start == yesterday_start:
                user.streak += 1
            else:
                user.streak = 1
    else:
        # First time login after registration
        user.streak = 1
        
    user.last_login_date = now
    await user.save()

    token = create_access_token(str(user.id))

    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Generate a password reset token.
    In production, this would send an email. Currently logs to console.
    """
    user = await User.find_one(User.email == request.email)

    if not user:
        # Don't reveal whether the email exists
        return {"message": "If the email exists, a reset link has been sent"}

    token, expires_at = generate_reset_token()
    user.reset_token = token
    user.reset_token_expires = expires_at
    await user.save()

    # TODO: Replace with actual email sending (SendGrid, Resend, etc.)
    print(f"[PASSWORD RESET] Token for {user.email}: {token}")

    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using a valid reset token."""
    user = await User.find_one(User.reset_token == request.token)

    if not user or not user.reset_token_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    if not verify_reset_token_expiry(user.reset_token_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired",
        )

    user.hashed_password = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    await user.save()

    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Change password for the authenticated user.
    If TOTP is enabled, a valid TOTP code is required.
    """
    # Verify TOTP if enabled
    if current_user.is_totp_enabled:
        if not request.totp_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="TOTP code required for password change",
            )
        if not current_user.totp_secret or not verify_totp(current_user.totp_secret, request.totp_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid TOTP code",
            )

    current_user.hashed_password = hash_password(request.new_password)
    await current_user.save()

    return {"message": "Password changed successfully"}
