"use client";

import { useEffect, useState } from "react";

interface ActionItem {
  text: string;
  assignee: string;
  done: boolean;
}

interface SpeakerStat {
  speaker: string;
  talk_time_pct: number;
}

interface SummaryData {
  summary: string;
  action_items: ActionItem[];
  keywords: string[];
  speaker_stats: SpeakerStat[];
}

const SPEAKER_COLORS = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#E91E63",
  "#9C27B0",
  "#00BCD4",
];

function getSpeakerColor(speaker: string, allSpeakers: string[]): string {
  const idx = allSpeakers.indexOf(speaker);
  return SPEAKER_COLORS[idx >= 0 ? idx % SPEAKER_COLORS.length : 0];
}

interface SummaryPanelProps {
  meetingId: string;
}

export function SummaryPanel({ meetingId }: SummaryPanelProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch(`/api/meetings/${meetingId}/summary`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-3 h-5 w-5 mx-auto animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#2563eb]" />
          <p className="text-[13px] text-[#6b7280]">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[13px] text-[#6b7280]">No summary available</p>
      </div>
    );
  }

  // speaker_stats can be an object {S1: {...}} or an array [{speaker: "S1", ...}]
  const speakerStatsArray = Array.isArray(data.speaker_stats)
    ? data.speaker_stats
    : data.speaker_stats
      ? Object.entries(data.speaker_stats).map(([key, val]) => ({
          speaker: key,
          ...(val as Record<string, unknown>),
        }))
      : [];
  const allSpeakers = speakerStatsArray.map((s) => s.speaker);

  return (
    <div className="flex flex-col">
      {/* Meeting Summary */}
      {data.summary && (
        <section className="pb-5 mb-5 border-b border-[#e5e7eb]">
          <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Meeting Summary
          </h3>
          <p className="text-[13px] leading-relaxed text-[#374151]">{data.summary}</p>
        </section>
      )}

      {/* Action Items */}
      {data.action_items && data.action_items.length > 0 && (
        <section className="pb-5 mb-5 border-b border-[#e5e7eb]">
          <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Action Items
          </h3>
          <ul className="flex flex-col gap-2.5">
            {data.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  defaultChecked={item.done}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[#d1d5db] accent-[#2563eb]"
                  readOnly
                />
                <div className="min-w-0">
                  <p className="text-[13px] text-[#374151]">{item.text}</p>
                  {item.assignee && (
                    <span
                      className="text-[11px] font-medium"
                      style={{
                        color: getSpeakerColor(item.assignee, allSpeakers),
                      }}
                    >
                      {item.assignee}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Keywords */}
      {data.keywords && data.keywords.length > 0 && (
        <section className="pb-5 mb-5 border-b border-[#e5e7eb]">
          <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Keywords
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {data.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-[#2563eb]"
              >
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Speaker Stats */}
      {speakerStatsArray.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Speaker Stats
          </h3>
          <div className="flex flex-col gap-3">
            {speakerStatsArray.map((stat) => {
              const color = getSpeakerColor(stat.speaker, allSpeakers);
              return (
                <div key={stat.speaker}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium" style={{ color }}>
                      {stat.speaker}
                    </span>
                    <span className="text-[11px] text-[#6b7280] tabular-nums">
                      {Math.round(stat.talk_time_pct)}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-[#f3f4f6]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, stat.talk_time_pct)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
