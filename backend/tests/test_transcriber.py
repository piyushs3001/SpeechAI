import sys
import pytest
from unittest.mock import patch, MagicMock

# Pre-mock whisper so the import doesn't fail
sys.modules.setdefault("whisper", MagicMock())

from transcriber import WhisperTranscriber


def test_transcribe_returns_segments():
    with patch("transcriber.whisper") as mock_whisper:
        mock_model = MagicMock()
        mock_whisper.load_model.return_value = mock_model
        mock_model.transcribe.return_value = {
            "segments": [
                {"start": 0.0, "end": 2.5, "text": " Hello world"},
                {"start": 2.8, "end": 5.0, "text": " How are you"},
            ]
        }
        # Reset singleton for test isolation
        WhisperTranscriber._instance = None
        WhisperTranscriber._current_model_name = None

        transcriber = WhisperTranscriber(model_name="base")
        segments = transcriber.transcribe("/tmp/test.wav")
        assert len(segments) == 2
        assert segments[0]["text"] == "Hello world"
        assert segments[0]["start"] == 0.0
