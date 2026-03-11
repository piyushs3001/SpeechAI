"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { UploadDropzone } from "@/components/upload-dropzone";
import { UploadProgress } from "@/components/upload-progress";

export default function UploadPage() {
  const fetchFolders = useAppStore((s) => s.fetchFolders);
  const [state, setState] = useState<"selecting" | "uploading">("selecting");
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  async function handleUpload(file: File, title: string, folderId: string | null) {
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    if (folderId) {
      formData.append("folder_id", folderId);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        setUploadError(err.detail || "Upload failed");
        return;
      }

      const data = await res.json();
      setJobId(data.job_id);
      setState("uploading");
    } catch {
      setUploadError("Network error. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-8">Upload Recording</h1>

      {state === "selecting" && (
        <>
          <UploadDropzone onUpload={handleUpload} />
          {uploadError && (
            <p className="mt-4 text-center text-sm text-red-400">{uploadError}</p>
          )}
        </>
      )}

      {state === "uploading" && jobId && (
        <UploadProgress jobId={jobId} />
      )}
    </div>
  );
}
