"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";

interface TeamMember {
  email: string;
  role: "admin" | "member";
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  function loadTeam() {
    setLoading(true);
    setLoadError(null);
    fetch("/api/team")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load team");
        return res.json();
      })
      .then((data) => {
        setMembers(data.members || []);
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : "Failed to load team"
        );
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTeam();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading team..." />;
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={loadTeam} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] transition-colors hover:text-[#111827] mb-4"
        >
          <ArrowLeft size={14} />
          Back to Settings
        </Link>
        <h1 className="text-2xl font-semibold text-[#111827]">Team</h1>
      </div>

      {/* Info */}
      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm text-[#374151]">
          Share your Google Drive folder with team members to give them access
          to meeting transcripts and recordings.
        </p>
      </div>

      {/* Members list */}
      {members.length === 0 ? (
        <EmptyState
          icon={<Users size={40} className="text-[#9ca3af]" />}
          message="No team members found"
          description="Share your Google Drive folder with others to grant access."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div
              key={member.email}
              className="flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm"
            >
              <span className="text-sm text-[#111827]">{member.email}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  member.role === "admin"
                    ? "bg-blue-50 text-[#2563eb]"
                    : "bg-[#f3f4f6] text-[#6b7280]"
                }`}
              >
                {member.role === "admin" ? "Admin" : "Member"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
