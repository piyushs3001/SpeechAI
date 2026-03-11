import whisper
from config import WHISPER_MODEL


class WhisperTranscriber:
    _instance = None
    _current_model_name = None

    def __init__(self, model_name: str = None):
        self.model_name = model_name or WHISPER_MODEL
        if WhisperTranscriber._instance is None or WhisperTranscriber._current_model_name != self.model_name:
            WhisperTranscriber._instance = whisper.load_model(self.model_name)
            WhisperTranscriber._current_model_name = self.model_name
        self.model = WhisperTranscriber._instance

    def transcribe(self, audio_path: str) -> list[dict]:
        result = self.model.transcribe(audio_path)
        segments = []
        for seg in result["segments"]:
            segments.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
            })
        return segments
