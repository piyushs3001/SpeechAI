import io
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient

# Patch pipeline.process_job before importing app so the lifespan doesn't
# attempt to actually process jobs using real ML packages.
with patch("main.process_job", new=MagicMock()):
    from main import app, job_queue

client = TestClient(app)


def setup_function():
    """Reset job queue state before each test."""
    job_queue.jobs.clear()


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_upload_creates_job():
    fake_file = io.BytesIO(b"fake audio content")
    resp = client.post(
        "/api/upload",
        files={"file": ("test.mp3", fake_file, "audio/mpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data
    assert "meeting_id" in data
    assert data["status"] == "queued"


def test_get_job_status():
    fake_file = io.BytesIO(b"fake audio content")
    upload_resp = client.post(
        "/api/upload",
        files={"file": ("test.mp3", fake_file, "audio/mpeg")},
    )
    job_id = upload_resp.json()["job_id"]

    resp = client.get(f"/api/jobs/{job_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["job_id"] == job_id
    assert data["status"] == "queued"
    assert "progress" in data


def test_get_job_not_found():
    resp = client.get("/api/jobs/nonexistent")
    assert resp.status_code == 404


def test_stream_job_not_found():
    resp = client.get("/api/jobs/nonexistent/stream")
    assert resp.status_code == 404


@patch("main._get_drive")
def test_list_meetings(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.list_files.return_value = [
        {"id": "f1", "name": "meeting_123.json", "modifiedTime": "2025-01-01"}
    ]
    mock_drive.read_json.return_value = {
        "meeting_id": "meeting_123",
        "title": "Test Meeting",
        "created_at": "2025-01-01T00:00:00Z",
        "folder": None,
        "speakers": {"S1": "Alice"},
    }

    resp = client.get("/api/meetings")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["meetings"]) == 1
    assert data["meetings"][0]["meeting_id"] == "meeting_123"


@patch("main._get_drive")
def test_get_meeting(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = "file_id_1"
    mock_drive.read_json.return_value = {
        "meeting_id": "m1",
        "title": "Test",
        "segments": [],
    }

    resp = client.get("/api/meetings/m1")
    assert resp.status_code == 200
    assert resp.json()["meeting_id"] == "m1"


@patch("main._get_drive")
def test_get_meeting_not_found(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = None

    resp = client.get("/api/meetings/nonexistent")
    assert resp.status_code == 404


@patch("main._get_drive")
def test_get_meeting_summary(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = "file_id_1"
    mock_drive.read_json.return_value = {
        "meeting_id": "m1",
        "summary": {"keywords": ["test"], "action_items": []},
    }

    resp = client.get("/api/meetings/m1/summary")
    assert resp.status_code == 200
    assert "keywords" in resp.json()


@patch("main._get_drive")
def test_update_meeting(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = "file_id_1"
    mock_drive.read_json.return_value = {
        "meeting_id": "m1",
        "title": "Old Title",
        "speakers": {},
        "folder": None,
    }

    resp = client.put("/api/meetings/m1", json={"title": "New Title"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "New Title"
    mock_drive.update_json.assert_called_once()


@patch("main._get_drive")
def test_list_folders(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = "fid"
    mock_drive.read_json.return_value = {
        "folders": [{"id": "f1", "name": "Work", "color": "#fff"}]
    }

    resp = client.get("/api/folders")
    assert resp.status_code == 200
    assert len(resp.json()["folders"]) == 1


@patch("main._get_drive")
def test_create_folder(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = None

    resp = client.post("/api/folders", json={"name": "New Folder"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "New Folder"
    assert "id" in data


@patch("main._get_drive")
def test_update_folder(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = "fid"
    mock_drive.read_json.return_value = {
        "folders": [{"id": "f1", "name": "Old", "color": "#000"}]
    }

    resp = client.put("/api/folders/f1", json={"name": "Updated"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated"


@patch("main._get_drive")
def test_delete_folder(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = "fid"
    mock_drive.read_json.return_value = {
        "folders": [{"id": "f1", "name": "ToDelete", "color": "#000"}]
    }

    resp = client.delete("/api/folders/f1")
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"


@patch("main._get_drive")
def test_delete_folder_not_found(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = "fid"
    mock_drive.read_json.return_value = {"folders": []}

    resp = client.delete("/api/folders/nonexistent")
    assert resp.status_code == 404


@patch("main._get_drive")
def test_search_index_empty(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = None

    resp = client.get("/api/search-index")
    assert resp.status_code == 200
    assert resp.json() == {"entries": []}


@patch("main._get_drive")
def test_get_settings_default(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = None

    resp = client.get("/api/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert data["whisper_model"] == "base"


@patch("main._get_drive")
def test_update_settings(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = "sid"

    resp = client.put("/api/settings", json={"whisper_model": "large"})
    assert resp.status_code == 200
    mock_drive.update_json.assert_called_once()


@patch("main._get_drive")
def test_get_team(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = None

    resp = client.get("/api/team")
    assert resp.status_code == 200
    assert resp.json() == {"members": []}


@patch("main._get_drive")
def test_update_team(mock_drive_fn):
    mock_drive = MagicMock()
    mock_drive_fn.return_value = mock_drive
    mock_drive.find_file.return_value = None

    resp = client.put("/api/team", json={"members": [{"name": "Alice"}]})
    assert resp.status_code == 200
    assert resp.json()["members"][0]["name"] == "Alice"
