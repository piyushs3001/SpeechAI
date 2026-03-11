def align_segments(whisper_segments: list[dict], diarization_segments: list[dict]) -> list[dict]:
    if not diarization_segments:
        return [{"speaker": "Unknown", **seg} for seg in whisper_segments]

    aligned = []
    for wseg in whisper_segments:
        best_speaker = _find_majority_speaker(wseg["start"], wseg["end"], diarization_segments)
        aligned.append({
            "speaker": best_speaker,
            "start": wseg["start"],
            "end": wseg["end"],
            "text": wseg["text"],
        })
    return aligned


def _find_majority_speaker(start: float, end: float, diar_segments: list[dict]) -> str:
    overlap_by_speaker: dict[str, float] = {}
    for dseg in diar_segments:
        overlap_start = max(start, dseg["start"])
        overlap_end = min(end, dseg["end"])
        overlap = max(0.0, overlap_end - overlap_start)
        if overlap > 0:
            speaker = dseg["speaker"]
            overlap_by_speaker[speaker] = overlap_by_speaker.get(speaker, 0.0) + overlap

    if not overlap_by_speaker:
        return "Unknown"

    return max(overlap_by_speaker, key=overlap_by_speaker.get)
