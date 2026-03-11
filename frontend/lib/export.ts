// Types
interface Segment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface Transcript {
  id: string;
  title: string;
  date: string;
  duration: number;
  speakers: Record<string, string>;
  segments: Segment[];
}

interface Summary {
  summary: string;
  action_items: { text: string; assignee: string }[];
  keywords: string[];
}

// TXT export
export function exportTXT(transcript: Transcript): string {
  return transcript.segments
    .map((seg) => {
      const speaker = transcript.speakers[seg.speaker] || seg.speaker;
      const time = formatTimestamp(seg.start);
      return `${speaker} [${time}]: ${seg.text}`;
    })
    .join("\n\n");
}

// SRT export
export function exportSRT(transcript: Transcript): string {
  return transcript.segments
    .map((seg, i) => {
      return `${i + 1}\n${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}\n${transcript.speakers[seg.speaker] || seg.speaker}: ${seg.text}\n`;
    })
    .join("\n");
}

// PDF export (using jsPDF)
export function exportPDF(transcript: Transcript, summary?: Summary): void {
  import("jspdf").then(({ jsPDF }) => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text(transcript.title, 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(
      `Date: ${transcript.date} | Duration: ${Math.round(transcript.duration / 60)} min`,
      20,
      y
    );
    y += 15;

    if (summary?.summary) {
      doc.setFontSize(14);
      doc.text("Summary", 20, y);
      y += 8;
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(summary.summary, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 10;
    }

    doc.setFontSize(14);
    doc.text("Transcript", 20, y);
    y += 8;
    doc.setFontSize(9);
    for (const seg of transcript.segments) {
      const speaker = transcript.speakers[seg.speaker] || seg.speaker;
      const line = `[${formatTimestamp(seg.start)}] ${speaker}: ${seg.text}`;
      const wrapped = doc.splitTextToSize(line, 170);
      if (y + wrapped.length * 4 > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(wrapped, 20, y);
      y += wrapped.length * 4 + 3;
    }

    doc.save(`${transcript.title || "transcript"}.pdf`);
  });
}

// Helper to trigger file download
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}
