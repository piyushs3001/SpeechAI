import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

from job_queue import Job, JobStatus, JobQueue
from id_generator import generate_meeting_id


def test_generate_meeting_id_format():
    mid = generate_meeting_id()
    assert mid.startswith("meeting_")
    parts = mid.split("_")
    assert len(parts) == 4
    assert len(parts[3]) == 6


def test_generate_meeting_id_unique():
    ids = {generate_meeting_id() for _ in range(100)}
    assert len(ids) == 100


def test_job_queue_add_and_get():
    queue = JobQueue()
    job = Job(id="test1", meeting_id="test1")
    queue.add_job(job)
    assert queue.get_job("test1") is job
    assert queue.get_job("nonexistent") is None


def test_job_queue_position():
    queue = JobQueue()
    job1 = Job(id="j1", meeting_id="j1")
    job2 = Job(id="j2", meeting_id="j2")
    queue.add_job(job1)
    queue.add_job(job2)
    assert queue.get_queue_position("j1") == 1
    assert queue.get_queue_position("j2") == 2


def test_job_status_transitions():
    job = Job(id="t1", meeting_id="t1")
    assert job.status == JobStatus.QUEUED
    job.status = JobStatus.TRANSCRIBING
    job.progress = 50.0
    assert job.status == JobStatus.TRANSCRIBING


def test_job_queue_process_handles_failure():
    queue = JobQueue()
    job = Job(id="fail1", meeting_id="fail1")
    queue.add_job(job)

    async def failing_processor(j):
        raise ValueError("something went wrong")

    async def run():
        task = asyncio.create_task(queue.process_jobs(failing_processor))
        await asyncio.sleep(0.1)
        queue.stop()
        await task

    asyncio.run(run())
    assert job.status == JobStatus.FAILED
    assert "something went wrong" in job.error


def test_job_queue_stop():
    queue = JobQueue()

    async def run():
        task = asyncio.create_task(queue.process_jobs(AsyncMock()))
        await asyncio.sleep(0.05)
        queue.stop()
        await task

    asyncio.run(run())
    assert queue._processing is False


def test_job_default_values():
    job = Job(id="d1", meeting_id="m1")
    assert job.progress == 0.0
    assert job.error is None
    assert job.result is None
    assert job.status == JobStatus.QUEUED
