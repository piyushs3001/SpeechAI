"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { MeetingCard } from "@/components/meeting-card";

export default function FolderViewPage() {
  const params = useParams<{ id: string }>();
  const folderId = params.id;

  const folders = useAppStore((s) => s.folders);
  const meetings = useAppStore((s) => s.meetings);
  const loading = useAppStore((s) => s.loading);
  const fetchFolders = useAppStore((s) => s.fetchFolders);
  const fetchMeetings = useAppStore((s) => s.fetchMeetings);

  useEffect(() => {
    fetchFolders();
    fetchMeetings();
  }, [fetchFolders, fetchMeetings]);

  const folder = folders.find((f) => f.id === folderId);

  const filteredMeetings = useMemo(
    () => meetings.filter((m) => m.folder_id === folderId),
    [meetings, folderId]
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/folders"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white mb-4"
        >
          <ArrowLeft size={14} />
          Back to Folders
        </Link>
        <div className="flex items-center gap-3">
          {folder && (
            <div
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: folder.color }}
            />
          )}
          <h1 className="text-2xl font-semibold text-white">
            {folder?.name || "Folder"}
          </h1>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mb-3 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-gray-600 border-t-[#64b5f6]" />
            <p className="text-sm text-gray-400">Loading meetings...</p>
          </div>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-500">
            No meetings in this folder yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
