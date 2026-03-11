import io
import json

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaInMemoryUpload, MediaIoBaseDownload

from config import GOOGLE_SERVICE_ACCOUNT_KEY_PATH, GOOGLE_DRIVE_FOLDER_ID

SCOPES = ["https://www.googleapis.com/auth/drive"]


class DriveClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            creds = service_account.Credentials.from_service_account_file(
                GOOGLE_SERVICE_ACCOUNT_KEY_PATH, scopes=SCOPES
            )
            cls._instance.service = build("drive", "v3", credentials=creds)
            cls._instance.root_folder_id = GOOGLE_DRIVE_FOLDER_ID
            cls._instance._folder_cache = {}
        return cls._instance

    def __init__(self):
        pass  # Initialization handled in __new__ for singleton

    def ensure_subfolder(self, path: str) -> str:
        """Ensure a subfolder exists, creating it if necessary.
        Supports nested paths like 'metadata/meetings'."""
        if path in self._folder_cache:
            return self._folder_cache[path]

        parts = path.split("/")
        parent_id = self.root_folder_id

        for i, part in enumerate(parts):
            cache_key = "/".join(parts[: i + 1])
            if cache_key in self._folder_cache:
                parent_id = self._folder_cache[cache_key]
                continue

            query = (
                f"name='{part}' and '{parent_id}' in parents "
                f"and mimeType='application/vnd.google-apps.folder' and trashed=false"
            )
            results = self.service.files().list(q=query, fields="files(id)").execute()
            files = results.get("files", [])

            if files:
                parent_id = files[0]["id"]
            else:
                metadata = {
                    "name": part,
                    "mimeType": "application/vnd.google-apps.folder",
                    "parents": [parent_id],
                }
                folder = (
                    self.service.files().create(body=metadata, fields="id").execute()
                )
                parent_id = folder["id"]

            self._folder_cache[cache_key] = parent_id

        return parent_id

    def upload_file(
        self, local_path: str, filename: str, subfolder: str, mime_type: str
    ) -> str:
        """Upload a file to a Drive subfolder. Returns the Drive file ID."""
        folder_id = self.ensure_subfolder(subfolder)
        file_metadata = {"name": filename, "parents": [folder_id]}
        media = MediaFileUpload(local_path, mimetype=mime_type)
        uploaded = (
            self.service.files()
            .create(body=file_metadata, media_body=media, fields="id")
            .execute()
        )
        return uploaded["id"]

    def upload_json(self, data: dict, filename: str, subfolder: str) -> str:
        """Upload a JSON object as a file to a Drive subfolder. Returns the Drive file ID."""
        folder_id = self.ensure_subfolder(subfolder)
        file_metadata = {"name": filename, "parents": [folder_id]}
        content = json.dumps(data, indent=2).encode("utf-8")
        media = MediaInMemoryUpload(content, mimetype="application/json")
        uploaded = (
            self.service.files()
            .create(body=file_metadata, media_body=media, fields="id")
            .execute()
        )
        return uploaded["id"]

    def download_file(self, file_id: str, local_path: str) -> None:
        """Download a file from Drive to a local path."""
        request = self.service.files().get_media(fileId=file_id)
        with open(local_path, "wb") as f:
            downloader = MediaIoBaseDownload(f, request)
            done = False
            while not done:
                _, done = downloader.next_chunk()

    def read_json(self, file_id: str) -> dict:
        """Read a JSON file from Drive and return its contents as a dict."""
        request = self.service.files().get_media(fileId=file_id)
        content = request.execute()
        return json.loads(content)

    def list_files(
        self, subfolder: str, name_prefix: str = ""
    ) -> list[dict]:
        """List files in a subfolder, optionally filtered by name prefix.
        Returns list of {id, name, modifiedTime}."""
        folder_id = self.ensure_subfolder(subfolder)
        query = f"'{folder_id}' in parents and trashed=false"
        if name_prefix:
            query += f" and name contains '{name_prefix}'"

        results = (
            self.service.files()
            .list(q=query, fields="files(id, name, modifiedTime)")
            .execute()
        )
        return results.get("files", [])

    def update_json(self, file_id: str, data: dict) -> None:
        """Update an existing JSON file in Drive."""
        content = json.dumps(data, indent=2).encode("utf-8")
        media = MediaInMemoryUpload(content, mimetype="application/json")
        self.service.files().update(
            fileId=file_id, media_body=media, fields="id"
        ).execute()

    def find_file(self, filename: str, subfolder: str) -> str | None:
        """Find a file by name in a subfolder. Returns file_id or None."""
        folder_id = self.ensure_subfolder(subfolder)
        query = (
            f"name='{filename}' and '{folder_id}' in parents and trashed=false"
        )
        results = (
            self.service.files().list(q=query, fields="files(id)").execute()
        )
        files = results.get("files", [])
        return files[0]["id"] if files else None
