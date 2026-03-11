import sys
import pytest
from unittest.mock import patch, MagicMock

# Pre-mock pyannote.audio so the import doesn't fail
sys.modules.setdefault("pyannote", MagicMock())
sys.modules.setdefault("pyannote.audio", MagicMock())

from diarizer import SpeakerDiarizer


def test_diarize_returns_speaker_segments():
    with patch("diarizer.Pipeline") as mock_pipeline_cls:
        mock_pipeline = MagicMock()
        mock_pipeline_cls.from_pretrained.return_value = mock_pipeline

        mock_turn1 = MagicMock()
        mock_turn1.start = 0.0
        mock_turn1.end = 4.0
        mock_turn2 = MagicMock()
        mock_turn2.start = 4.2
        mock_turn2.end = 8.0
        mock_pipeline.return_value.itertracks.return_value = [
            (mock_turn1, None, "SPEAKER_00"),
            (mock_turn2, None, "SPEAKER_01"),
        ]

        # Reset singleton for test isolation
        SpeakerDiarizer._instance = None

        diarizer = SpeakerDiarizer()
        segments = diarizer.diarize("/tmp/test.wav")
        assert len(segments) == 2
        assert segments[0]["speaker"] == "S1"
        assert segments[1]["speaker"] == "S2"
