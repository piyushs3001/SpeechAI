import asyncio
import json
import logging
import os
import tempfile
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from id_generator import generate_meeting_id
from job_queue import Job, JobStatus, job_queue
from pipeline import process_job

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(job_queue.process_jobs(process_job))
    yield
    job_queue.stop()
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="SpeechAI Backend", lifespan=lifespan)
# No CORS needed — Next.js API routes proxy all requests to FastAPI.


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Upload & Jobs
# ---------------------------------------------------------------------------


@app.post("/api/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    meeting_id = generate_meeting_id()
    job_id = meeting_id

    # Preserve file extension so ffmpeg can detect format
    ext = os.path.splitext(file.filename or "")[1] or ".audio"
    tmp_path = os.path.join(tempfile.gettempdir(), f"{meeting_id}_upload{ext}")
    with open(tmp_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            f.write(chunk)

    access_token = _get_token(request)
    job = Job(id=job_id, meeting_id=meeting_id, access_token=access_token)
    job_queue.add_job(job)

    return {
        "job_id": job_id,
        "meeting_id": meeting_id,
        "status": job.status.value,
    }


@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = job_queue.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job.id,
        "meeting_id": job.meeting_id,
        "status": job.status.value,
        "progress": job.progress,
        "error": job.error,
        "queue_position": job_queue.get_queue_position(job_id),
    }


@app.get("/api/jobs/{job_id}/stream")
async def stream_job_progress(job_id: str):
    job = job_queue.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        last_status = None
        last_progress = None
        while True:
            if job.status != last_status or job.progress != last_progress:
                last_status = job.status
                last_progress = job.progress
                data = json.dumps({
                    "status": job.status.value,
                    "progress": job.progress,
                    "error": job.error,
                })
                yield f"data: {data}\n\n"

                if job.status in (JobStatus.COMPLETE, JobStatus.FAILED):
                    break
            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Meetings
# ---------------------------------------------------------------------------


def _get_token(request: Request) -> str:
    """Extract Bearer token from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        logger.error("No Authorization header found in request")
        raise HTTPException(status_code=401, detail="Missing access token")
    token = auth[7:]
    logger.info(f"Got access token: {token[:20]}...")
    return token


def _get_drive(request: Request):
    """Create a DriveClient using the user's OAuth access token."""
    from drive_client import DriveClient
    return DriveClient(_get_token(request))


@app.get("/api/meetings")
async def list_meetings(request: Request):
    try:
        drive = _get_drive(request)
        files = drive.list_files("metadata/meetings")
        meetings = []
        for f in files:
            if f["name"].endswith(".json"):
                try:
                    data = drive.read_json(f["id"])
                    meetings.append({
                        "meeting_id": data.get("meeting_id"),
                        "title": data.get("title"),
                        "created_at": data.get("created_at"),
                        "folder": data.get("folder"),
                        "speakers": data.get("speakers", {}),
                    })
                except Exception:
                    continue
        return {"meetings": meetings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/meetings/{meeting_id}")
async def get_meeting(meeting_id: str, request: Request):
    try:
        drive = _get_drive(request)
        file_id = drive.find_file(f"{meeting_id}.json", "metadata/meetings")
        if not file_id:
            raise HTTPException(status_code=404, detail="Meeting not found")
        data = drive.read_json(file_id)
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/meetings/{meeting_id}/summary")
async def get_meeting_summary(meeting_id: str, request: Request):
    try:
        drive = _get_drive(request)
        file_id = drive.find_file(f"{meeting_id}.json", "metadata/meetings")
        if not file_id:
            raise HTTPException(status_code=404, detail="Meeting not found")
        data = drive.read_json(file_id)
        return data.get("summary", {})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    speakers: Optional[dict[str, str]] = None
    folder: Optional[str] = None


@app.put("/api/meetings/{meeting_id}")
async def update_meeting(meeting_id: str, update: MeetingUpdate, request: Request):
    try:
        drive = _get_drive(request)
        file_id = drive.find_file(f"{meeting_id}.json", "metadata/meetings")
        if not file_id:
            raise HTTPException(status_code=404, detail="Meeting not found")
        data = drive.read_json(file_id)
        if update.title is not None:
            data["title"] = update.title
        if update.speakers is not None:
            data["speakers"] = update.speakers
        if update.folder is not None:
            data["folder"] = update.folder
        drive.update_json(file_id, data)
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Folders
# ---------------------------------------------------------------------------


def _load_folders_data(drive):
    file_id = drive.find_file("folders.json", "metadata")
    if file_id:
        return file_id, drive.read_json(file_id)
    return None, {"folders": []}


def _save_folders_data(drive, file_id, data):
    if file_id:
        drive.update_json(file_id, data)
    else:
        drive.upload_json(data, "folders.json", "metadata")


@app.get("/api/folders")
async def list_folders(request: Request):
    try:
        drive = _get_drive(request)
        _, data = _load_folders_data(drive)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class FolderCreate(BaseModel):
    name: str
    color: Optional[str] = "#6366f1"


@app.post("/api/folders")
async def create_folder(folder: FolderCreate, request: Request):
    try:
        drive = _get_drive(request)
        file_id, data = _load_folders_data(drive)
        import secrets
        new_folder = {
            "id": secrets.token_hex(4),
            "name": folder.name,
            "color": folder.color,
        }
        data["folders"].append(new_folder)
        _save_folders_data(drive, file_id, data)
        return new_folder
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


@app.put("/api/folders/{folder_id}")
async def update_folder(folder_id: str, update: FolderUpdate, request: Request):
    try:
        drive = _get_drive(request)
        file_id, data = _load_folders_data(drive)
        for f in data["folders"]:
            if f["id"] == folder_id:
                if update.name is not None:
                    f["name"] = update.name
                if update.color is not None:
                    f["color"] = update.color
                _save_folders_data(drive, file_id, data)
                return f
        raise HTTPException(status_code=404, detail="Folder not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/folders/{folder_id}")
async def delete_folder(folder_id: str, request: Request):
    try:
        drive = _get_drive(request)
        file_id, data = _load_folders_data(drive)
        original_len = len(data["folders"])
        data["folders"] = [f for f in data["folders"] if f["id"] != folder_id]
        if len(data["folders"]) == original_len:
            raise HTTPException(status_code=404, detail="Folder not found")
        _save_folders_data(drive, file_id, data)
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Search Index
# ---------------------------------------------------------------------------


@app.get("/api/search-index")
async def get_search_index(request: Request):
    try:
        drive = _get_drive(request)
        file_id = drive.find_file("search_index.json", "metadata")
        if not file_id:
            return {"entries": []}
        return drive.read_json(file_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


def _load_settings(drive):
    file_id = drive.find_file("settings.json", "metadata")
    if file_id:
        return file_id, drive.read_json(file_id)
    default = {
        "whisper_model": "base",
        "default_mode": "free",
        "auto_summarize": True,
        "language": "en",
    }
    return None, default


@app.get("/api/settings")
async def get_settings(request: Request):
    try:
        drive = _get_drive(request)
        _, settings = _load_settings(drive)
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/settings")
async def update_settings(settings: dict, request: Request):
    try:
        drive = _get_drive(request)
        file_id, _ = _load_settings(drive)
        if file_id:
            drive.update_json(file_id, settings)
        else:
            drive.upload_json(settings, "settings.json", "metadata")
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Team
# ---------------------------------------------------------------------------


def _load_team(drive):
    file_id = drive.find_file("team.json", "metadata")
    if file_id:
        return file_id, drive.read_json(file_id)
    default = {"members": []}
    return None, default


@app.get("/api/team")
async def get_team(request: Request):
    try:
        drive = _get_drive(request)
        _, team = _load_team(drive)
        return team
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/team")
async def update_team(team: dict, request: Request):
    try:
        drive = _get_drive(request)
        file_id, _ = _load_team(drive)
        if file_id:
            drive.update_json(file_id, team)
        else:
            drive.upload_json(team, "team.json", "metadata")
        return team
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
