"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mic } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { MeetingCard } from "@/components/meeting-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";

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
          className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] transition-colors hover:text-[#111827] mb-4"
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
          <h1 className="text-2xl font-semibold text-[#111827]">
            {folder?.name || "Folder"}
          </h1>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading meetings..." />
      ) : filteredMeetings.length === 0 ? (
        <EmptyState
          icon={<Mic size={40} className="text-[#9ca3af]" />}
          message="No meetings in this folder yet"
          description="Upload a recording or move an existing meeting here."
        />
      ) : (
        <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden shadow-sm">
          {filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
