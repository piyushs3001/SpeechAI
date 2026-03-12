import os
import subprocess
import tempfile


def _has_audio_stream(input_path: str) -> bool:
    """Check if a file contains an audio stream."""
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-select_streams", "a",
         "-show_entries", "stream=codec_type", "-of", "csv=p=0", input_path],
        capture_output=True, text=True,
    )
    return "audio" in result.stdout


def convert_to_wav(input_path: str) -> str:
    if not _has_audio_stream(input_path):
        raise ValueError(
            "File has no audio stream. Please upload a file that contains audio "
            "(e.g., .mp3, .wav, .m4a, .mp4 with audio, .webm)."
        )

    output_path = os.path.join(
        tempfile.gettempdir(),
        os.path.splitext(os.path.basename(input_path))[0] + "_converted.wav"
    )
    result = subprocess.run(
        ["ffmpeg", "-i", input_path, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-y", output_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg conversion failed: {result.stderr[-500:]}")
    return output_path


def get_duration(file_path: str) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", file_path],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())
