"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface UploadDropzoneProps {
  onUpload: (file: File, title: string, folderId: string | null) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const ACCEPT =
  "audio/*,video/*,.mp3,.wav,.m4a,.ogg,.flac,.mp4,.webm,.mkv,.avi";

export function UploadDropzone({ onUpload }: UploadDropzoneProps) {
  const folders = useAppStore((s) => s.folders);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("Untitled Meeting");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-14 text-center transition-colors ${
          isDragOver
            ? "border-[#2563eb] bg-blue-50"
            : "border-[#d1d5db] hover:border-[#9ca3af]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {file ? (
          <div>
            <p className="text-[15px] font-medium text-[#111827]">{file.name}</p>
            <p className="mt-1 text-[13px] text-[#6b7280]">
              {formatFileSize(file.size)} &middot; {file.type || "unknown type"}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="mt-3 text-[13px] text-[#6b7280] hover:text-[#374151] transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex justify-center">
              <Upload size={32} className="text-[#9ca3af]" />
            </div>
            <p className="text-[15px] text-[#374151]">
              Drag &amp; drop an audio or video file here
            </p>
            <p className="mt-1 text-[13px] text-[#6b7280]">
              or click to browse
            </p>
            <p className="mt-4 text-[11px] text-[#9ca3af]">
              Supports MP3, WAV, M4A, OGG, FLAC, MP4, WebM, MKV, AVI
            </p>
          </div>
        )}
      </div>

      {/* Title input */}
      <div>
        <label htmlFor="upload-title" className="block text-[12px] font-medium text-[#6b7280] mb-1.5">
          Title
        </label>
        <input
          id="upload-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-[14px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors"
          placeholder="Meeting title"
        />
      </div>

      {/* Folder selector */}
      <div>
        <label htmlFor="upload-folder" className="block text-[12px] font-medium text-[#6b7280] mb-1.5">
          Folder
        </label>
        <select
          id="upload-folder"
          value={folderId || ""}
          onChange={(e) => setFolderId(e.target.value || null)}
          className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-[14px] text-[#111827] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors"
        >
          <option value="">No folder</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Upload button */}
      <button
        disabled={!file}
        onClick={() => {
          if (file) onUpload(file, title, folderId);
        }}
        className="w-full rounded-lg bg-[#2563eb] px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Upload &amp; Transcribe
      </button>
    </div>
  );
}
