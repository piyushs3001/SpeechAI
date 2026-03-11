from unittest.mock import patch
from audio_converter import convert_to_wav


@patch("audio_converter.subprocess.run")
def test_convert_to_wav_calls_ffmpeg(mock_run):
    mock_run.return_value = None
    result = convert_to_wav("/tmp/input.mp4")
    assert result.endswith(".wav")
    mock_run.assert_called_once()
    args = mock_run.call_args[0][0]
    assert "ffmpeg" in args
    assert "-ar" in args
    assert "16000" in args
