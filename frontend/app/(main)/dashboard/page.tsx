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
        <h1 className="text-2xl font-semibold text-white">My Meetings</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/recorder"
            className="inline-flex items-center gap-2 rounded-lg bg-[#64b5f6] px-4 py-2 text-sm font-medium text-[#0f0f1a] transition-colors hover:bg-[#64b5f6]/80"
          >
            New Recording
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[rgba(255,255,255,0.12)]"
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
          icon={<Mic size={40} className="text-gray-600" />}
          message="No meetings yet"
          description="Upload a recording or start a new one."
          action={
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/recorder"
                className="inline-flex items-center gap-2 rounded-lg bg-[#64b5f6] px-4 py-2 text-sm font-medium text-[#0f0f1a] transition-colors hover:bg-[#64b5f6]/80"
              >
                New Recording
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[rgba(255,255,255,0.12)]"
              >
                Upload
              </Link>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
