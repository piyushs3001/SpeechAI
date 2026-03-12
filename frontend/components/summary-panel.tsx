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
      <div className="flex items-center justify-center py-10">
        <div className="text-center">
          <div className="mb-3 h-6 w-6 mx-auto animate-spin rounded-full border-2 border-gray-600 border-t-[#64b5f6]" />
          <p className="text-xs text-gray-400">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-sm text-gray-500">No summary available</p>
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
    <div className="flex flex-col gap-5">
      {/* Meeting Summary */}
      {data.summary && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Meeting Summary
          </h3>
          <p className="text-sm leading-relaxed text-gray-300">{data.summary}</p>
        </section>
      )}

      {/* Action Items */}
      {data.action_items && data.action_items.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Action Items
          </h3>
          <ul className="flex flex-col gap-2">
            {data.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  defaultChecked={item.done}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600 bg-transparent accent-[#64b5f6]"
                  readOnly
                />
                <div className="min-w-0">
                  <p className="text-sm text-gray-300">{item.text}</p>
                  {item.assignee && (
                    <span
                      className="text-xs font-medium"
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
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Keywords
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {data.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-[#64b5f6]/15 px-2.5 py-0.5 text-xs font-medium text-[#64b5f6]"
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
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Speaker Stats
          </h3>
          <div className="flex flex-col gap-2.5">
            {speakerStatsArray.map((stat) => {
              const color = getSpeakerColor(stat.speaker, allSpeakers);
              return (
                <div key={stat.speaker}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color }}>
                      {stat.speaker}
                    </span>
                    <span className="text-[11px] text-gray-500 tabular-nums">
                      {Math.round(stat.talk_time_pct)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.08)]">
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
