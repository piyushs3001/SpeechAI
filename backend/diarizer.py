from pyannote.audio import Pipeline
from config import HF_AUTH_TOKEN


class SpeakerDiarizer:
    _instance = None

    def __init__(self):
        if SpeakerDiarizer._instance is None:
            SpeakerDiarizer._instance = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                token=HF_AUTH_TOKEN,
            )
        self.pipeline = SpeakerDiarizer._instance

    def diarize(self, audio_path: str) -> list[dict]:
        diarization = self.pipeline(audio_path)
        speaker_map = {}
        counter = 1
        segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            if speaker not in speaker_map:
                speaker_map[speaker] = f"S{counter}"
                counter += 1
            segments.append({
                "speaker": speaker_map[speaker],
                "start": turn.start,
                "end": turn.end,
            })
        return segments
