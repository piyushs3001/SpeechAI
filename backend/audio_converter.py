import os
import subprocess
import tempfile


def convert_to_wav(input_path: str) -> str:
    output_path = os.path.join(
        tempfile.gettempdir(),
        os.path.splitext(os.path.basename(input_path))[0] + "_converted.wav"
    )
    subprocess.run(
        ["ffmpeg", "-i", input_path, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-y", output_path],
        check=True, capture_output=True,
    )
    return output_path


def get_duration(file_path: str) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", file_path],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())
