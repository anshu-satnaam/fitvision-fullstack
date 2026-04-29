"""
TOTP (Two-Factor Authentication) routes.
"""

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.models.user import User
from app.services.totp_service import generate_totp_secret, generate_qr_code, verify_totp

router = APIRouter(prefix="/totp", tags=["Two-Factor Auth"])


class TOTPSetupResponse(BaseModel):
    secret: str
    qr_code: str  # base64-encoded PNG


class TOTPVerifyRequest(BaseModel):
    otp: str


@router.get("/setup", response_model=TOTPSetupResponse)
async def totp_setup(
    current_user: User = Depends(get_current_user),
):
    """
    Generate a TOTP secret and QR code for the user to scan.
    The secret is stored on the user but TOTP is NOT enabled until verified.
    """
    secret = generate_totp_secret()
    qr_code = generate_qr_code(current_user.username, secret)

    # Store the secret (but don't enable TOTP yet)
    current_user.totp_secret = secret
    await current_user.save()

    return TOTPSetupResponse(secret=secret, qr_code=qr_code)


@router.post("/verify")
async def totp_verify(
    request: TOTPVerifyRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Verify a TOTP code and enable 2FA for the user.
    User must have called /totp/setup first.
    """
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="TOTP not set up. Call /totp/setup first.",
        )

    if not verify_totp(current_user.totp_secret, request.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code",
        )

    current_user.is_totp_enabled = True
    await current_user.save()

    return {"message": "TOTP enabled successfully"}
