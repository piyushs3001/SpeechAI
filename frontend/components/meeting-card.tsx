"use client";

import Link from "next/link";
import { Mic, FileText } from "lucide-react";
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
      <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">
        Failed
      </span>
    );
  }
  if (meeting.has_summary) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#2563eb]/10 px-2 py-0.5 text-[11px] font-medium text-[#2563eb]">
        Summary Ready
      </span>
    );
  }
  if (meeting.action_item_count > 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-400">
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
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: `${folder.color}15`,
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

  const content = (
    <div className="border-b border-white/5 px-4 py-3.5 transition-colors hover:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
            {meeting.status === "failed" ? (
              <FileText size={16} className="text-gray-500" />
            ) : (
              <Mic size={16} className="text-[#2563eb]" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-medium text-white truncate">
              {meeting.title}
            </h3>
            <p className="mt-0.5 text-[13px] text-gray-500">
              {formatDate(meeting.date)}
              {meeting.duration > 0 && (
                <span className="mx-1.5 text-gray-600">·</span>
              )}
              {meeting.duration > 0 && formatDuration(meeting.duration)}
              {meeting.speakers.length > 0 && (
                <>
                  <span className="mx-1.5 text-gray-600">·</span>
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
          className="absolute right-4 bottom-3 text-[11px] text-red-400 hover:text-red-300 font-medium"
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
