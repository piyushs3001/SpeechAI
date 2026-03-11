"use client";

import { useState } from "react";
import { AudioRecorder } from "@/components/audio-recorder";
import { UploadProgress } from "@/components/upload-progress";
import { useToast } from "@/components/toast";

export default function RecorderPage() {
  const { error: toastError } = useToast();
  const [title, setTitle] = useState("Untitled Meeting");
  const [state, setState] = useState<"recording" | "uploading">("recording");
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleRecordingComplete(blob: Blob) {
    setUploadError(null);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `recording_${timestamp}.webm`;

    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("title", title);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        const msg = err.detail || "Upload failed";
        setUploadError(msg);
        toastError(msg);
        return;
      }

      const data = await res.json();
      setJobId(data.job_id);
      setState("uploading");
    } catch {
      const msg = "Network error. Please try again.";
      setUploadError(msg);
      toastError(msg);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-8">New Recording</h1>

      {state === "recording" && (
        <div className="space-y-8">
          {/* Title input */}
          <div className="mx-auto max-w-md">
            <label htmlFor="rec-title" className="block text-xs font-medium text-gray-400 mb-1.5">
              Title
            </label>
            <input
              id="rec-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#64b5f6] transition-colors text-center"
              placeholder="Meeting title"
            />
          </div>

          {/* Recorder */}
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />

          {/* Error */}
          {uploadError && (
            <p className="text-center text-sm text-red-400">{uploadError}</p>
          )}
        </div>
      )}

      {state === "uploading" && jobId && (
        <UploadProgress jobId={jobId} />
      )}
    </div>
  );
}
