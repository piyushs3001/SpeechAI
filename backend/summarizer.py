import re
import math
from collections import Counter
from typing import Optional

from config import OPENAI_API_KEY, ANTHROPIC_API_KEY

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "it", "that", "this", "was", "are",
    "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "shall", "can",
    "not", "so", "if", "then", "than", "too", "very", "just", "about",
    "up", "out", "no", "yes", "as", "into", "all", "its", "my", "we",
    "our", "your", "he", "she", "they", "them", "his", "her", "i", "me",
    "you", "what", "which", "who", "when", "where", "how", "each",
    "there", "their", "also", "more", "some", "any", "other", "over",
}

ACTION_PATTERNS = [
    re.compile(r"\bi'?ll\b", re.IGNORECASE),
    re.compile(r"\bwe need to\b", re.IGNORECASE),
    re.compile(r"\blet'?s\b", re.IGNORECASE),
    re.compile(r"\bshould\b.*\bby\b", re.IGNORECASE),
    re.compile(r"\bdeadline\b", re.IGNORECASE),
    re.compile(r"\bwill handle\b", re.IGNORECASE),
    re.compile(r"\bschedule\b", re.IGNORECASE),
    re.compile(r"\bfollow up\b", re.IGNORECASE),
]


class Summarizer:
    def __init__(self, mode: str = "free", api_key: Optional[str] = None):
        self.mode = mode
        self.api_key = api_key

    def summarize(self, segments: list[dict], speakers: dict[str, str]) -> dict:
        speaker_stats = self._compute_speaker_stats(segments, speakers)
        action_items = self._extract_action_items(segments, speakers)
        keywords = self._extract_keywords(segments)

        if self.mode == "enhanced" and self._has_api_key():
            summary = self._enhanced_summarize(segments, speakers)
        else:
            summary = self._extractive_summarize(segments)

        return {
            "summary": summary,
            "keywords": keywords,
            "action_items": action_items,
            "speaker_stats": speaker_stats,
        }

    def _has_api_key(self) -> bool:
        if self.api_key:
            return True
        return bool(OPENAI_API_KEY or ANTHROPIC_API_KEY)

    def _compute_speaker_stats(
        self, segments: list[dict], speakers: dict[str, str]
    ) -> dict:
        stats: dict[str, dict] = {}
        total_time = 0.0

        for seg in segments:
            spk = seg["speaker"]
            duration = seg["end"] - seg["start"]
            word_count = len(seg["text"].split())
            total_time += duration

            if spk not in stats:
                stats[spk] = {
                    "name": speakers.get(spk, spk),
                    "talk_time": 0.0,
                    "word_count": 0,
                }
            stats[spk]["talk_time"] += duration
            stats[spk]["word_count"] += word_count

        for spk in stats:
            if total_time > 0:
                stats[spk]["talk_time_pct"] = round(
                    (stats[spk]["talk_time"] / total_time) * 100
                )
            else:
                stats[spk]["talk_time_pct"] = 0

        return stats

    def _extract_keywords(self, segments: list[dict], top_n: int = 10) -> list[str]:
        words = []
        for seg in segments:
            for word in re.findall(r"[a-zA-Z]+", seg["text"].lower()):
                if word not in STOPWORDS and len(word) > 2:
                    words.append(word)

        counter = Counter(words)
        return [w for w, _ in counter.most_common(top_n)]

    def _extract_action_items(
        self, segments: list[dict], speakers: dict[str, str]
    ) -> list[dict]:
        items = []
        for seg in segments:
            text = seg["text"]
            for pattern in ACTION_PATTERNS:
                if pattern.search(text):
                    speaker_name = speakers.get(seg["speaker"], seg["speaker"])
                    items.append({
                        "speaker": speaker_name,
                        "text": text.strip(),
                    })
                    break
        return items

    def _extractive_summarize(self, segments: list[dict], top_n: int = 3) -> str:
        sentences = [seg["text"].strip() for seg in segments if seg["text"].strip()]
        if not sentences:
            return ""
        if len(sentences) <= top_n:
            return " ".join(sentences)

        # Simple TF-IDF-like scoring
        doc_count: dict[str, int] = {}
        word_freq_per_sent: list[Counter] = []
        num_docs = len(sentences)

        for sent in sentences:
            words = [
                w
                for w in re.findall(r"[a-zA-Z]+", sent.lower())
                if w not in STOPWORDS and len(w) > 2
            ]
            freq = Counter(words)
            word_freq_per_sent.append(freq)
            for w in set(words):
                doc_count[w] = doc_count.get(w, 0) + 1

        idf = {}
        for w, count in doc_count.items():
            idf[w] = math.log(num_docs / count) if count > 0 else 0

        scores = []
        for i, freq in enumerate(word_freq_per_sent):
            score = sum(tf * idf.get(w, 0) for w, tf in freq.items())
            scores.append((score, i))

        scores.sort(reverse=True)
        top_indices = sorted([idx for _, idx in scores[:top_n]])
        return " ".join(sentences[i] for i in top_indices)

    def _enhanced_summarize(self, segments: list[dict], speakers: dict[str, str]) -> str:
        """Call an LLM API for abstractive summarization. Falls back to extractive."""
        transcript = "\n".join(
            f"{speakers.get(s['speaker'], s['speaker'])}: {s['text']}"
            for s in segments
        )
        prompt = (
            "Summarize the following meeting transcript in 2-3 concise paragraphs. "
            "Highlight key decisions, action items, and important discussion points.\n\n"
            f"{transcript}"
        )

        api_key = self.api_key or ANTHROPIC_API_KEY
        if api_key:
            try:
                return self._call_anthropic(prompt, api_key)
            except Exception:
                pass

        api_key = self.api_key or OPENAI_API_KEY
        if api_key:
            try:
                return self._call_openai(prompt, api_key)
            except Exception:
                pass

        return self._extractive_summarize(segments)

    def _call_anthropic(self, prompt: str, api_key: str) -> str:
        import httpx

        resp = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]

    def _call_openai(self, prompt: str, api_key: str) -> str:
        import httpx

        resp = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1024,
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
