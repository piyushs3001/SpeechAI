"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AudioPlayer } from "@/components/audio-player";
import { TranscriptSegment } from "@/components/transcript-segment";
import { SummaryPanel } from "@/components/summary-panel";
import {
  exportTXT,
  exportSRT,
  exportPDF,
  downloadFile,
} from "@/lib/export";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";

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
  speakers: string[] | Record<string, string>;
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    summary: string;
    action_items: { text: string; assignee: string }[];
    keywords: string[];
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    fetch(`/api/meetings/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load transcript");
        return res.json();
      })
      .then((data) => {
        if (!cancelled)
          setMeeting({
            ...data,
            id: data.meeting_id || data.id,
            date: data.created_at || data.date || "",
            duration: data.duration || 0,
            has_summary: !!data.summary,
            audio_drive_id: data.audio_file_id || data.audio_drive_id,
          });
      })
      .catch((err) => {
        if (!cancelled)
          setFetchError(
            err instanceof Error ? err.message : "Failed to load transcript"
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Fetch summary for PDF export
    fetch(`/api/meetings/${id}/summary`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSummaryData(data);
      })
      .catch(() => {
        // summary is optional
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
    return <LoadingSpinner message="Loading transcript..." />;
  }

  if (fetchError) {
    return (
      <ErrorState
        message={fetchError}
        onRetry={() => {
          setFetchError(null);
          setLoading(true);
          fetch(`/api/meetings/${id}`)
            .then((res) => {
              if (!res.ok) throw new Error("Failed to load transcript");
              return res.json();
            })
            .then((data) => setMeeting(data))
            .catch((err) =>
              setFetchError(
                err instanceof Error ? err.message : "Failed to load transcript"
              )
            )
            .finally(() => setLoading(false));
        }}
      />
    );
  }

  if (!meeting) {
    return (
      <EmptyState
        message="Transcript not found."
        action={
          <Link
            href="/dashboard"
            className="inline-block text-sm text-[#64b5f6] hover:underline"
          >
            Back to Dashboard
          </Link>
        }
      />
    );
  }

  const segments = meeting.segments ?? [];
  const speakersRaw = meeting.speakers ?? [];
  const speakers: string[] = Array.isArray(speakersRaw)
    ? speakersRaw
    : Object.keys(speakersRaw);
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
                    <button
                      onClick={() => {
                        const speakerMap = Object.fromEntries(speakers.map((s) => [s, s]));
                        const txt = exportTXT({ ...meeting, speakers: speakerMap });
                        downloadFile(txt, `${meeting.title || "transcript"}.txt`, "text/plain");
                        setExportOpen(false);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-[rgba(255,255,255,0.08)]"
                    >
                      Export as TXT
                    </button>
                    <button
                      onClick={() => {
                        const speakerMap = Object.fromEntries(speakers.map((s) => [s, s]));
                        const srt = exportSRT({ ...meeting, speakers: speakerMap });
                        downloadFile(srt, `${meeting.title || "transcript"}.srt`, "text/srt");
                        setExportOpen(false);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-[rgba(255,255,255,0.08)]"
                    >
                      Export as SRT
                    </button>
                    <button
                      onClick={() => {
                        const speakerMap = Object.fromEntries(speakers.map((s) => [s, s]));
                        exportPDF(
                          { ...meeting, speakers: speakerMap },
                          summaryData || undefined
                        );
                        setExportOpen(false);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-[rgba(255,255,255,0.08)]"
                    >
                      Export as PDF
                    </button>
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
            <EmptyState
              message="No transcript segments available."
              className="py-10"
            />
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
