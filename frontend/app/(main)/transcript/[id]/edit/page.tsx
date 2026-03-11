"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store";

interface MeetingDetail {
  id: string;
  title: string;
  date: string;
  duration: number;
  speakers: string[];
  folder_id: string | null;
}

export default function TranscriptEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const folders = useAppStore((s) => s.folders);
  const fetchFolders = useAppStore((s) => s.fetchFolders);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({});
  const [folderId, setFolderId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/meetings/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data: MeetingDetail) => {
        if (cancelled) return;
        setTitle(data.title);
        setFolderId(data.folder_id);
        const names: Record<string, string> = {};
        (data.speakers ?? []).forEach((s) => {
          names[s] = s;
        });
        setSpeakerNames(names);
      })
      .catch(() => {
        if (!cancelled) {
          setMessage({ type: "error", text: "Failed to load meeting data." });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          speaker_names: speakerNames,
          folder_id: folderId,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setMessage({ type: "success", text: "Changes saved successfully." });
      setTimeout(() => {
        router.push(`/transcript/${id}`);
      }, 800);
    } catch {
      setMessage({ type: "error", text: "Failed to save changes. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-3 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-gray-600 border-t-[#64b5f6]" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const originalSpeakers = Object.keys(speakerNames);

  return (
    <div className="mx-auto max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-white">Edit Transcript</h1>
        <Link
          href={`/transcript/${id}`}
          className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Meeting Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#64b5f6] focus:ring-1 focus:ring-[#64b5f6]/30"
            placeholder="Enter meeting title"
          />
        </div>

        {/* Speaker rename */}
        {originalSpeakers.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Speaker Names
            </label>
            <div className="flex flex-col gap-3">
              {originalSpeakers.map((original) => (
                <div key={original} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-gray-500 truncate">
                    {original}
                  </span>
                  <input
                    type="text"
                    value={speakerNames[original] ?? ""}
                    onChange={(e) =>
                      setSpeakerNames((prev) => ({
                        ...prev,
                        [original]: e.target.value,
                      }))
                    }
                    className="flex-1 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#64b5f6] focus:ring-1 focus:ring-[#64b5f6]/30"
                    placeholder="Rename speaker"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Folder assignment */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Folder
          </label>
          <select
            value={folderId ?? ""}
            onChange={(e) => setFolderId(e.target.value || null)}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#64b5f6] focus:ring-1 focus:ring-[#64b5f6]/30"
          >
            <option value="" className="bg-[#1a1a2e]">
              No folder
            </option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id} className="bg-[#1a1a2e]">
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#64b5f6] px-4 py-2 text-sm font-medium text-[#0f0f1a] transition-colors hover:bg-[#64b5f6]/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href={`/transcript/${id}`}
            className="inline-flex items-center rounded-lg bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[rgba(255,255,255,0.12)]"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
