"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Mic } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { MeetingCard } from "@/components/meeting-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";

export default function DashboardPage() {
  const meetings = useAppStore((s) => s.meetings);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const fetchMeetings = useAppStore((s) => s.fetchMeetings);
  const fetchFolders = useAppStore((s) => s.fetchFolders);

  useEffect(() => {
    fetchMeetings();
    fetchFolders();
  }, [fetchMeetings, fetchFolders]);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-white">My Meetings</h1>
        <div className="flex items-center gap-2.5">
          <Link
            href="/recorder"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#2563eb]/80"
          >
            New Recording
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-gray-300 transition-colors hover:bg-white/[0.1]"
          >
            Upload
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading meetings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchMeetings} />
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={<Mic size={36} className="text-gray-600" />}
          message="No meetings yet"
          description="Upload a recording or start a new one."
          action={
            <div className="flex items-center justify-center gap-2.5">
              <Link
                href="/recorder"
                className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#2563eb]/80"
              >
                New Recording
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-gray-300 transition-colors hover:bg-white/[0.1]"
              >
                Upload
              </Link>
            </div>
          }
        />
      ) : (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
