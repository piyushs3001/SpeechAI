"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AudioPlayer } from "@/components/audio-player";
import { TranscriptSegment } from "@/components/transcript-segment";
import { SummaryPanel } from "@/components/summary-panel";

const SPEAKER_COLORS = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#E91E63",
  "#9C27B0",
  "#00BCD4",
];

interface Segment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface MeetingDetail {
  id: string;
  title: string;
  date: string;
  duration: number;
  speakers: string[];
  segments: Segment[];
  audio_drive_id?: string;
  has_summary: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getSpeakerColor(speaker: string, speakers: string[]): string {
  const idx = speakers.indexOf(speaker);
  return SPEAKER_COLORS[idx >= 0 ? idx % SPEAKER_COLORS.length : 0];
}

export default function TranscriptViewerPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/meetings/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setMeeting(data);
      })
      .catch(() => {
        // error state handled by meeting being null
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
    }
    setCurrentTime(time);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-3 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-gray-600 border-t-[#64b5f6]" />
          <p className="text-sm text-gray-400">Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-gray-400">Transcript not found.</p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block text-sm text-[#64b5f6] hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const segments = meeting.segments ?? [];
  const speakers = meeting.speakers ?? [];
  const audioUrl = meeting.audio_drive_id
    ? `/api/audio/${meeting.audio_drive_id}`
    : "";

  const activeSegmentIndex = segments.findIndex(
    (seg) => currentTime >= seg.start && currentTime < seg.end
  );

  return (
    <div className="flex gap-6 h-[calc(100vh-3rem)]">
      {/* Left panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="mb-4 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-white truncate">
                {meeting.title}
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                {formatDate(meeting.date)}
                {meeting.duration > 0 && (
                  <>
                    <span className="mx-1.5">·</span>
                    {formatDuration(meeting.duration)}
                  </>
                )}
                {speakers.length > 0 && (
                  <>
                    <span className="mx-1.5">·</span>
                    {speakers.length} speaker{speakers.length !== 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/transcript/${id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-[rgba(255,255,255,0.12)]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </Link>

              {/* Export dropdown */}
              <div className="relative">
                <button
                  onClick={() => setExportOpen(!exportOpen)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-[rgba(255,255,255,0.12)]"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {exportOpen && (
                  <div className="absolute right-0 top-full mt-1 z-10 w-32 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1a1a2e] py-1 shadow-xl">
                    {["TXT", "SRT", "PDF"].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportOpen(false)}
                        className="block w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-[rgba(255,255,255,0.08)]"
                      >
                        Export as {fmt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Audio player */}
        {audioUrl && (
          <div className="mb-4 shrink-0">
            <AudioPlayer audioUrl={audioUrl} onTimeUpdate={handleTimeUpdate} />
          </div>
        )}

        {/* Transcript segments */}
        <div className="flex-1 overflow-y-auto -mr-2 pr-2">
          {segments.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-gray-500">No transcript segments available.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {segments.map((seg, i) => (
                <TranscriptSegment
                  key={i}
                  segment={seg}
                  speakerName={seg.speaker}
                  speakerColor={getSpeakerColor(seg.speaker, speakers)}
                  isActive={i === activeSegmentIndex}
                  onClick={() => handleSeek(seg.start)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <aside className="w-80 shrink-0 overflow-y-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
        <SummaryPanel meetingId={id} />
      </aside>
    </div>
  );
}
