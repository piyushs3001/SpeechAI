import secrets
from datetime import datetime


def generate_meeting_id() -> str:
    now = datetime.now()
    timestamp = now.strftime("%Y%m%d_%H%M%S")
    suffix = secrets.token_hex(3)
    return f"meeting_{timestamp}_{suffix}"
