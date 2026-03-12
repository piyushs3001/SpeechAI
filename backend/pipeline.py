import asyncio
import logging
import os
import tempfile
import time

from job_queue import Job, JobStatus

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_BASE_DELAY = 1.0


async def _retry_drive_op(op, *args, retries=MAX_RETRIES, **kwargs):
    """Retry a Drive operation with exponential backoff."""
    for attempt in range(retries):
        try:
            return await asyncio.to_thread(op, *args, **kwargs)
        except Exception as e:
            if attempt == retries - 1:
                raise
            delay = RETRY_BASE_DELAY * (2 ** attempt)
            logger.warning(
                f"Drive operation failed (attempt {attempt + 1}/{retries}): {e}. "
                f"Retrying in {delay}s..."
            )
            await asyncio.sleep(delay)


async def process_job(job: Job):
    """Full transcription pipeline for a single job."""
    # Lazy imports to avoid loading ML packages at module import time
    from audio_converter import convert_to_wav
    from transcriber import WhisperTranscriber
    from diarizer import SpeakerDiarizer
    from aligner import align_segments
    from summarizer import Summarizer
    from drive_client import DriveClient

    tmp_dir = tempfile.gettempdir()
    # Find the upload file (has extension preserved from upload)
    import glob
    matches = glob.glob(os.path.join(tmp_dir, f"{job.meeting_id}_upload*"))
    if not matches:
        raise RuntimeError(f"Upload file not found for {job.meeting_id}")
    local_audio_path = matches[0]
    wav_path = None

    try:
        drive = DriveClient(job.access_token, getattr(job, 'refresh_token', ''))

        # Determine the Drive subfolder for this meeting.
        # Unfoldered meetings go under meetings/{meeting_id}/
        # Foldered meetings go under {folder_name}/{meeting_id}/
        folder_name = getattr(job, "folder_name", None)
        if folder_name:
            meeting_subfolder = f"{folder_name}/{job.meeting_id}"
        else:
            meeting_subfolder = f"meetings/{job.meeting_id}"

        # Derive a friendly filename from the original upload extension
        ext = os.path.splitext(local_audio_path)[1] or ""
        audio_filename = f"audio_original{ext}"

        # Step 1: Upload to Drive
        job.status = JobStatus.UPLOADING
        job.progress = 5.0
        audio_file_id = await _retry_drive_op(
            drive.upload_file,
            local_audio_path,
            audio_filename,
            meeting_subfolder,
            "audio/mpeg",
        )

        # Step 2: Convert audio
        job.progress = 10.0
        wav_path = await asyncio.to_thread(convert_to_wav, local_audio_path)

        # Step 3: Transcription + Diarization in parallel
        job.status = JobStatus.TRANSCRIBING
        job.progress = 20.0

        async def run_transcription():
            transcriber = WhisperTranscriber()
            return await asyncio.to_thread(transcriber.transcribe, wav_path)

        async def run_diarization():
            try:
                diarizer = SpeakerDiarizer()
                return await asyncio.to_thread(diarizer.diarize, wav_path)
            except Exception as e:
                logger.warning(f"Diarization failed, continuing without: {e}")
                return []

        transcribe_task = asyncio.create_task(run_transcription())
        diarize_task = asyncio.create_task(run_diarization())

        whisper_segments = await transcribe_task
        job.progress = 50.0

        job.status = JobStatus.DIARIZING
        diar_segments = await diarize_task
        job.progress = 70.0

        # Step 4: Align
        job.status = JobStatus.ALIGNING
        job.progress = 75.0
        aligned = align_segments(whisper_segments, diar_segments)

        # Step 5: Summarize
        job.status = JobStatus.SUMMARIZING
        job.progress = 80.0

        speakers = {}
        for seg in aligned:
            spk = seg["speaker"]
            if spk not in speakers:
                speakers[spk] = spk

        summarizer = Summarizer(mode="free")
        summary_data = summarizer.summarize(aligned, speakers)

        # Step 6: Save to Drive
        job.status = JobStatus.SAVING
        job.progress = 90.0

        meeting_data = {
            "meeting_id": job.meeting_id,
            "title": job.meeting_id,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "audio_file_id": audio_file_id,
            "drive_subfolder": meeting_subfolder,
            "segments": aligned,
            "summary": summary_data,
            "speakers": speakers,
            "folder": folder_name,
        }

        await _retry_drive_op(
            drive.upload_json,
            meeting_data,
            "meeting.json",
            meeting_subfolder,
        )

        # Rebuild search index
        try:
            await _rebuild_search_index(drive)
        except Exception as e:
            logger.warning(f"Search index rebuild failed: {e}")

        # Done
        job.status = JobStatus.COMPLETE
        job.progress = 100.0
        job.result = meeting_data

    except Exception as e:
        logger.error(f"Pipeline failed for job {job.id}: {e}")
        job.status = JobStatus.FAILED
        job.error = str(e)
        raise

    finally:
        # Cleanup temp files
        for path in [local_audio_path, wav_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass


async def _rebuild_search_index(drive):
    """Rebuild the search index by scanning per-meeting folders.

    Meetings are stored as:
      meetings/{meeting_id}/meeting.json          (unfoldered)
      {folder_name}/{meeting_id}/meeting.json     (foldered)

    We enumerate top-level folders in the SpeechAI root, then for each
    non-metadata folder we look one level deeper for meeting.json files.
    """
    index_entries = []

    # List all items directly under root
    root_children = await asyncio.to_thread(
        drive.list_folder_children, drive.root_folder_id
    )

    MIME_FOLDER = "application/vnd.google-apps.folder"
    SKIP_FOLDERS = {"metadata"}

    for item in root_children:
        if item.get("mimeType") != MIME_FOLDER:
            continue
        if item["name"] in SKIP_FOLDERS:
            continue

        # Each child folder may be 'meetings' or a user-created folder.
        # Either way, list its children (which should be per-meeting subfolders).
        level1_children = await asyncio.to_thread(
            drive.list_folder_children, item["id"]
        )
        for meeting_folder in level1_children:
            if meeting_folder.get("mimeType") != MIME_FOLDER:
                continue
            # Look for meeting.json inside this per-meeting folder
            file_id = await asyncio.to_thread(
                drive.find_file_in_folder_id, "meeting.json", meeting_folder["id"]
            )
            if not file_id:
                continue
            try:
                data = await asyncio.to_thread(drive.read_json, file_id)
                text_content = " ".join(
                    seg.get("text", "") for seg in data.get("segments", [])
                )
                index_entries.append({
                    "meeting_id": data.get("meeting_id", ""),
                    "title": data.get("title", ""),
                    "created_at": data.get("created_at", ""),
                    "text": text_content,
                    "keywords": data.get("summary", {}).get("keywords", []),
                })
            except Exception as e:
                logger.warning(
                    f"Failed to index meeting in folder {meeting_folder['name']}: {e}"
                )

    existing_id = await asyncio.to_thread(
        drive.find_file, "search_index.json", "metadata"
    )
    if existing_id:
        await asyncio.to_thread(
            drive.update_json, existing_id, {"entries": index_entries}
        )
    else:
        await asyncio.to_thread(
            drive.upload_json, {"entries": index_entries}, "search_index.json", "metadata"
        )
