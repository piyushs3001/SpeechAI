from aligner import align_segments


def test_align_assigns_speaker_by_majority_overlap():
    whisper_segments = [
        {"start": 0.0, "end": 3.0, "text": "Hello everyone"},
        {"start": 3.5, "end": 7.0, "text": "Good to be here"},
    ]
    diarization_segments = [
        {"speaker": "S1", "start": 0.0, "end": 4.0},
        {"speaker": "S2", "start": 4.0, "end": 8.0},
    ]
    result = align_segments(whisper_segments, diarization_segments)
    assert result[0]["speaker"] == "S1"
    assert result[0]["text"] == "Hello everyone"
    assert result[1]["speaker"] == "S2"


def test_align_handles_empty_diarization():
    whisper_segments = [{"start": 0.0, "end": 3.0, "text": "Hello"}]
    result = align_segments(whisper_segments, [])
    assert result[0]["speaker"] == "Unknown"


def test_align_handles_no_overlap():
    whisper_segments = [{"start": 10.0, "end": 12.0, "text": "Late segment"}]
    diarization_segments = [{"speaker": "S1", "start": 0.0, "end": 5.0}]
    result = align_segments(whisper_segments, diarization_segments)
    assert result[0]["speaker"] == "Unknown"
