"use client";

import Link from "next/link";
import type { Meeting, Folder } from "@/lib/store";
import { useAppStore } from "@/lib/store";

interface MeetingCardProps {
  meeting: Meeting;
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
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today, ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return `Yesterday, ${timeStr}`;

  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`;
}

function StatusBadge({ meeting }: { meeting: Meeting }) {
  if (meeting.status === "failed") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
        Failed
      </span>
    );
  }
  if (meeting.has_summary) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#64b5f6]/10 px-2.5 py-0.5 text-xs font-medium text-[#64b5f6]">
        Summary Ready
      </span>
    );
  }
  if (meeting.action_item_count > 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-400">
        {meeting.action_item_count} Action Item{meeting.action_item_count !== 1 ? "s" : ""}
      </span>
    );
  }
  return null;
}

function FolderBadge({ folder }: { folder: Folder | undefined }) {
  if (!folder) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${folder.color}20`,
        color: folder.color,
      }}
    >
      {folder.name}
    </span>
  );
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const folders = useAppStore((s) => s.folders);
  const folder = meeting.folder_id
    ? folders.find((f) => f.id === meeting.folder_id)
    : undefined;

  const icon = meeting.status === "failed" ? "📁" : "🎙️";

  const content = (
    <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 transition-colors hover:bg-[rgba(255,255,255,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xl shrink-0 mt-0.5">{icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white truncate">
              {meeting.title}
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              {formatDate(meeting.date)}
              {meeting.duration > 0 && (
                <span className="mx-1.5">·</span>
              )}
              {meeting.duration > 0 && formatDuration(meeting.duration)}
              {meeting.speakers.length > 0 && (
                <>
                  <span className="mx-1.5">·</span>
                  {meeting.speakers.length} speaker{meeting.speakers.length !== 1 ? "s" : ""}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FolderBadge folder={folder} />
          <StatusBadge meeting={meeting} />
        </div>
      </div>
    </div>
  );

  if (meeting.status === "failed") {
    return (
      <div className="group relative">
        {content}
        <button
          onClick={() => {
            // Retry logic would go here
            window.location.href = "/upload";
          }}
          className="absolute right-4 bottom-3 text-xs text-red-400 hover:text-red-300 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <Link href={`/transcript/${meeting.id}`} className="block">
      {content}
    </Link>
  );
}
