"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface TeamMember {
  email: string;
  role: "admin" | "member";
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setMembers(data.members || []);
      })
      .catch(() => {
        // silently fail
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-3 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-gray-600 border-t-[#64b5f6]" />
          <p className="text-sm text-gray-400">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white mb-4"
        >
          <ArrowLeft size={14} />
          Back to Settings
        </Link>
        <h1 className="text-2xl font-semibold text-white">Team</h1>
      </div>

      {/* Info */}
      <div className="mb-6 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#64b5f6]/5 p-4">
        <p className="text-sm text-gray-300">
          Share your Google Drive folder with team members to give them access
          to meeting transcripts and recordings.
        </p>
      </div>

      {/* Members list */}
      {members.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-500">No team members found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div
              key={member.email}
              className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4"
            >
              <span className="text-sm text-white">{member.email}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  member.role === "admin"
                    ? "bg-[#64b5f6]/10 text-[#64b5f6]"
                    : "bg-[rgba(255,255,255,0.08)] text-gray-400"
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
