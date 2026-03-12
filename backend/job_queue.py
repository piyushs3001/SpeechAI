import asyncio
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Callable
import logging

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    QUEUED = "queued"
    UPLOADING = "uploading"
    TRANSCRIBING = "transcribing"
    DIARIZING = "diarizing"
    ALIGNING = "aligning"
    SUMMARIZING = "summarizing"
    SAVING = "saving"
    COMPLETE = "complete"
    FAILED = "failed"


@dataclass
class Job:
    id: str
    meeting_id: str
    access_token: str = ""
    status: JobStatus = JobStatus.QUEUED
    progress: float = 0.0
    error: Optional[str] = None
    result: Optional[dict] = None


class JobQueue:
    def __init__(self):
        self.jobs: dict[str, Job] = {}
        self._queue: asyncio.Queue = asyncio.Queue()
        self._processing = False

    def add_job(self, job: Job):
        self.jobs[job.id] = job
        self._queue.put_nowait(job)

    def get_job(self, job_id: str) -> Optional[Job]:
        return self.jobs.get(job_id)

    def get_queue_position(self, job_id: str) -> int:
        position = 0
        for jid, job in self.jobs.items():
            if job.status == JobStatus.QUEUED:
                position += 1
                if jid == job_id:
                    return position
        return 0

    async def process_jobs(self, process_fn: Callable):
        self._processing = True
        while self._processing:
            try:
                job = await asyncio.wait_for(self._queue.get(), timeout=1.0)
                try:
                    await process_fn(job)
                except Exception as e:
                    logger.error(f"Job {job.id} failed: {e}")
                    job.status = JobStatus.FAILED
                    job.error = str(e)
            except asyncio.TimeoutError:
                continue

    def stop(self):
        self._processing = False


job_queue = JobQueue()
