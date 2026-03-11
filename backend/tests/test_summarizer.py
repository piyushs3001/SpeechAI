from summarizer import Summarizer


def test_free_summarize_returns_structure():
    segments = [
        {"speaker": "S1", "start": 0.0, "end": 5.0, "text": "We need to finish the report by Friday."},
        {"speaker": "S2", "start": 5.5, "end": 10.0, "text": "I'll handle the design section."},
        {"speaker": "S1", "start": 10.5, "end": 15.0, "text": "Great. Let's also schedule a review meeting next week."},
    ]
    speakers = {"S1": "Alice", "S2": "Bob"}
    summarizer = Summarizer(mode="free")
    result = summarizer.summarize(segments, speakers)
    assert "summary" in result
    assert "keywords" in result
    assert "action_items" in result
    assert "speaker_stats" in result
    assert isinstance(result["action_items"], list)


def test_speaker_stats_calculated():
    segments = [
        {"speaker": "S1", "start": 0.0, "end": 5.0, "text": "Hello world test words here"},
        {"speaker": "S2", "start": 5.0, "end": 10.0, "text": "More words from speaker two"},
    ]
    speakers = {"S1": "Alice", "S2": "Bob"}
    summarizer = Summarizer(mode="free")
    result = summarizer.summarize(segments, speakers)
    assert "S1" in result["speaker_stats"]
    assert "S2" in result["speaker_stats"]
    assert result["speaker_stats"]["S1"]["talk_time_pct"] == 50


def test_action_items_detected():
    segments = [
        {"speaker": "S1", "start": 0.0, "end": 5.0, "text": "We need to finish the report."},
        {"speaker": "S2", "start": 5.0, "end": 10.0, "text": "I'll handle it."},
        {"speaker": "S1", "start": 10.0, "end": 15.0, "text": "The weather is nice today."},
    ]
    speakers = {"S1": "Alice", "S2": "Bob"}
    summarizer = Summarizer(mode="free")
    result = summarizer.summarize(segments, speakers)
    texts = [item["text"] for item in result["action_items"]]
    assert "We need to finish the report." in texts
    assert "I'll handle it." in texts
    assert "The weather is nice today." not in texts


def test_keywords_extracted():
    segments = [
        {"speaker": "S1", "start": 0.0, "end": 5.0, "text": "The project deadline is Friday."},
        {"speaker": "S2", "start": 5.0, "end": 10.0, "text": "Friday works for the project review."},
    ]
    speakers = {"S1": "Alice", "S2": "Bob"}
    summarizer = Summarizer(mode="free")
    result = summarizer.summarize(segments, speakers)
    assert isinstance(result["keywords"], list)
    assert len(result["keywords"]) > 0
    assert "friday" in result["keywords"] or "project" in result["keywords"]


def test_extractive_summary_content():
    segments = [
        {"speaker": "S1", "start": 0.0, "end": 5.0, "text": "We need to finish the report by Friday."},
        {"speaker": "S2", "start": 5.5, "end": 10.0, "text": "I'll handle the design section."},
    ]
    speakers = {"S1": "Alice", "S2": "Bob"}
    summarizer = Summarizer(mode="free")
    result = summarizer.summarize(segments, speakers)
    assert len(result["summary"]) > 0
