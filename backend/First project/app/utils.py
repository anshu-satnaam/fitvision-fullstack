"""
Utility helpers used across the application.
"""


def validate_password_bytes(password: str) -> bool:
    """
    Validate that the password does not exceed 72 bytes when UTF-8 encoded.
    bcrypt silently truncates passwords longer than 72 bytes.
    Returns True if valid, False otherwise.
    """
    return len(password.encode("utf-8")) <= 72
