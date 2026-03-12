import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (one level up from backend/)
_project_root = Path(__file__).resolve().parent.parent
load_dotenv(_project_root / ".env")

_default_sa_path = str(_project_root / "service-account.json")
_sa_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_KEY_PATH", _default_sa_path)
# Resolve relative paths against project root
GOOGLE_SERVICE_ACCOUNT_KEY_PATH = str((_project_root / _sa_path).resolve()) if not os.path.isabs(_sa_path) else _sa_path
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")
HF_AUTH_TOKEN = os.getenv("HF_AUTH_TOKEN", "")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
FASTAPI_PORT = int(os.getenv("FASTAPI_PORT", "8000"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
