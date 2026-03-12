"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface UploadProgressProps {
  jobId: string;
}

interface JobStatus {
  status: string;
  progress: number;
  step: string;
  queue_position?: number;
  error?: string;
  meeting_id?: string;
}

const STEP_LABELS: Record<string, string> = {
  uploading: "Uploading to Drive",
  transcribing: "Transcribing audio",
  diarizing: "Identifying speakers",
  aligning: "Aligning segments",
  summarizing: "Generating summary",
  saving: "Saving results",
  queued: "Queued",
  complete: "Complete",
  completed: "Complete",
  failed: "Failed",
};

export function UploadProgress({ jobId }: UploadProgressProps) {
  const [status, setStatus] = useState<JobStatus>({
    status: "queued",
    progress: 0,
    step: "uploading",
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    async function connectSSE() {
      try {
        const res = await fetch(`/api/jobs/${jobId}/stream`, {
          signal: controller.signal,
        });
        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                setStatus(data);
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Fall back to polling if SSE fails
        pollStatus();
      }
    }

    async function pollStatus() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
          if (data.status !== "complete" && data.status !== "completed" && data.status !== "failed") {
            setTimeout(pollStatus, 2000);
          }
        }
      } catch {
        // silently fail
      }
    }

    connectSSE();

    return () => {
      controller.abort();
    };
  }, [jobId]);

  const isComplete = status.status === "complete" || status.status === "completed";
  const isFailed = status.status === "failed";
  const stepLabel = STEP_LABELS[status.status] || STEP_LABELS[status.step] || status.status || "Processing";
  const meetingId = status.meeting_id || jobId;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#374151]">{stepLabel}</span>
          <span className="text-sm text-[#6b7280]">{Math.round(status.progress)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#e5e7eb] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>

      {/* Queue position */}
      {status.status === "queued" && status.queue_position != null && (
        <p className="text-sm text-[#6b7280] text-center">
          Queue position: {status.queue_position}
        </p>
      )}

      {/* Complete state */}
      {isComplete && (
        <div className="text-center space-y-4">
          <p className="text-sm text-green-600">
            Transcription complete!
          </p>
          <Link
            href={`/transcript/${meetingId}`}
            className="inline-flex items-center rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
          >
            View Transcript
          </Link>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="text-center space-y-4">
          <p className="text-sm text-red-600">
            {status.error || "Processing failed. Please try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
