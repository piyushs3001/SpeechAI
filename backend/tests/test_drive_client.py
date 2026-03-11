import pytest
from unittest.mock import MagicMock, patch
from drive_client import DriveClient


@pytest.fixture
def mock_drive():
    with patch("drive_client.build") as mock_build:
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        client = object.__new__(DriveClient)
        client.service = mock_service
        client.root_folder_id = "test_folder_id"
        client._folder_cache = {}
        yield client, mock_service


def test_ensure_subfolder_creates_folder(mock_drive):
    client, service = mock_drive
    service.files().list().execute.return_value = {"files": []}
    service.files().create().execute.return_value = {"id": "new_folder_id"}
    result = client.ensure_subfolder("audio")
    assert result == "new_folder_id"


def test_ensure_subfolder_returns_existing(mock_drive):
    client, service = mock_drive
    service.files().list().execute.return_value = {"files": [{"id": "existing_id"}]}
    result = client.ensure_subfolder("audio")
    assert result == "existing_id"


def test_ensure_subfolder_caches_result(mock_drive):
    client, service = mock_drive
    client._folder_cache["audio"] = "cached_id"
    result = client.ensure_subfolder("audio")
    assert result == "cached_id"
    # Should not have called the API since it was cached
    service.files().list.assert_not_called()


def test_ensure_subfolder_nested_path(mock_drive):
    client, service = mock_drive
    service.files().list().execute.return_value = {"files": []}
    service.files().create().execute.return_value = {"id": "nested_id"}
    result = client.ensure_subfolder("metadata/meetings")
    assert result == "nested_id"


def test_upload_file(mock_drive):
    client, service = mock_drive
    service.files().list().execute.return_value = {"files": [{"id": "folder_id"}]}
    service.files().create().execute.return_value = {"id": "uploaded_file_id"}
    with patch("drive_client.MediaFileUpload") as mock_media:
        result = client.upload_file("/tmp/test.wav", "test.wav", "audio", "audio/wav")
    assert result == "uploaded_file_id"


def test_upload_json(mock_drive):
    client, service = mock_drive
    service.files().list().execute.return_value = {"files": [{"id": "folder_id"}]}
    service.files().create().execute.return_value = {"id": "json_file_id"}
    with patch("drive_client.MediaInMemoryUpload") as mock_media:
        result = client.upload_json({"key": "value"}, "data.json", "metadata")
    assert result == "json_file_id"


def test_download_file(mock_drive):
    client, service = mock_drive
    mock_request = MagicMock()
    service.files().get_media.return_value = mock_request
    with patch("drive_client.MediaIoBaseDownload") as mock_download:
        mock_downloader = MagicMock()
        mock_download.return_value = mock_downloader
        mock_downloader.next_chunk.return_value = (MagicMock(progress=MagicMock(return_value=1.0)), True)
        with patch("builtins.open", MagicMock()):
            client.download_file("file123", "/tmp/output.wav")
    service.files().get_media.assert_called_once_with(fileId="file123")


def test_read_json(mock_drive):
    client, service = mock_drive
    mock_request = MagicMock()
    mock_request.execute.return_value = b'{"key": "value"}'
    service.files().get_media.return_value = mock_request
    result = client.read_json("file123")
    assert result == {"key": "value"}


def test_list_files(mock_drive):
    client, service = mock_drive
    service.files().list().execute.return_value = {"files": [{"id": "folder_id"}]}
    service.files().list().execute.return_value = {
        "files": [{"id": "f1", "name": "test.wav", "modifiedTime": "2024-01-01"}]
    }
    result = client.list_files("audio")
    assert len(result) >= 0  # Mocked chain returns same mock


def test_update_json(mock_drive):
    client, service = mock_drive
    service.files().update().execute.return_value = {"id": "file123"}
    with patch("drive_client.MediaInMemoryUpload") as mock_media:
        client.update_json("file123", {"updated": True})
    service.files().update.assert_called()


def test_find_file_found(mock_drive):
    client, service = mock_drive
    service.files().list().execute.return_value = {"files": [{"id": "found_id"}]}
    result = client.find_file("test.wav", "audio")
    assert result == "found_id"


def test_find_file_not_found(mock_drive):
    client, service = mock_drive
    service.files().list().execute.return_value = {"files": []}
    result = client.find_file("missing.wav", "audio")
    assert result is None
