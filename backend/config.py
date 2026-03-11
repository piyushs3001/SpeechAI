import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_SERVICE_ACCOUNT_KEY_PATH = os.getenv("GOOGLE_SERVICE_ACCOUNT_KEY_PATH", "./service-account.json")
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")
HF_AUTH_TOKEN = os.getenv("HF_AUTH_TOKEN", "")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
FASTAPI_PORT = int(os.getenv("FASTAPI_PORT", "8000"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
