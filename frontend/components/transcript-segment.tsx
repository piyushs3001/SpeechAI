"use client";

interface Segment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface TranscriptSegmentProps {
  segment: Segment;
  speakerName: string;
  speakerColor: string;
  isActive: boolean;
  onClick: () => void;
}

const ACTION_KEYWORDS = ["I'll", "we need to", "schedule", "deadline"];

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function hasActionItem(text: string): boolean {
  const lower = text.toLowerCase();
  return ACTION_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

export function TranscriptSegment({
  segment,
  speakerName,
  speakerColor,
  isActive,
  onClick,
}: TranscriptSegmentProps) {
  const isAction = hasActionItem(segment.text);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 transition-colors ${
        isActive
          ? "bg-[#2563eb]/[0.08]"
          : "hover:bg-white/[0.02]"
      } ${isAction ? "border-l-2 border-l-orange-500/70 pl-[14px]" : ""}`}
    >
      {isAction && (
        <span className="mb-1.5 inline-block rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-400">
          Action Item
        </span>
      )}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
          style={{ backgroundColor: speakerColor }}
        >
          {speakerName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          {/* Speaker + timestamp */}
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-medium" style={{ color: speakerColor }}>
              {speakerName}
            </span>
            <span className="text-[11px] text-gray-600 tabular-nums">
              {formatTimestamp(segment.start)}
            </span>
          </div>
          {/* Text */}
          <p className="mt-0.5 text-[14px] leading-relaxed text-gray-300">
            {segment.text}
          </p>
        </div>
      </div>
    </button>
  );
}
