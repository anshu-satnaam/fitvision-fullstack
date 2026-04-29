"""
TOTP (Time-based One-Time Password) service for 2FA.
"""

import io
import base64

import pyotp
import qrcode

from app.config import get_settings

settings = get_settings()


def generate_totp_secret() -> str:
    """Generate a new random TOTP secret."""
    return pyotp.random_base32()


def generate_qr_code(username: str, secret: str) -> str:
    """
    Generate a QR code for the TOTP provisioning URI.
    Returns a base64-encoded PNG string.
    """
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=username,
        issuer_name=settings.TOTP_ISSUER_NAME,
    )

    # Generate QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to base64 PNG
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def verify_totp(secret: str, otp: str) -> bool:
    """Verify a TOTP code against the user's secret."""
    totp = pyotp.TOTP(secret)
    return totp.verify(otp, valid_window=1)  # Allow 1 step tolerance
