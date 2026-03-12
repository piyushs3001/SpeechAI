"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMediaRecorder } from "@/hooks/use-media-recorder";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function WaveformVisualizer({ analyserNode }: { analyserNode: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserNode) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barCount = 40;

    function draw() {
      if (!ctx || !canvas || !analyserNode) return;
      animationRef.current = requestAnimationFrame(draw);

      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / barCount;
      const gap = 2;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        const barHeight = Math.max(4, value * canvas.height * 0.9);
        const x = i * barWidth + gap / 2;
        const y = (canvas.height - barHeight) / 2;

        ctx.fillStyle = `rgba(37, 99, 235, ${0.4 + value * 0.6})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - gap, barHeight, 2);
        ctx.fill();
      }
    }

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyserNode]);

  // Static bars when not recording
  if (!analyserNode) {
    return (
      <div className="flex h-24 items-center justify-center gap-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 rounded-sm bg-white/[0.06]"
            style={{ height: 4 }}
          />
        ))}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={96}
      className="h-24 w-full max-w-[600px]"
    />
  );
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const {
    start,
    pause,
    resume,
    stop,
    audioBlob,
    duration,
    state,
    isRecording,
    isPaused,
    error,
    analyserNode,
  } = useMediaRecorder();

  const hasCalledBack = useRef(false);

  useEffect(() => {
    if (audioBlob && !hasCalledBack.current) {
      hasCalledBack.current = true;
      onRecordingComplete(audioBlob);
    }
  }, [audioBlob, onRecordingComplete]);

  const handleRecord = useCallback(async () => {
    hasCalledBack.current = false;
    await start();
  }, [start]);

  const isActive = state !== "idle";

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Recording indicator */}
      <div className="flex items-center gap-2 h-6">
        {isRecording && (
          <>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[13px] text-red-400">Recording...</span>
          </>
        )}
        {isPaused && (
          <span className="text-[13px] text-yellow-400">Paused</span>
        )}
      </div>

      {/* Timer */}
      <div className="font-mono text-5xl text-white tabular-nums tracking-tight">
        {formatTime(duration)}
      </div>

      {/* Waveform */}
      <div className="flex w-full items-center justify-center">
        <WaveformVisualizer analyserNode={analyserNode} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        {/* Record / Stop row */}
        {!isActive ? (
          <button
            onClick={handleRecord}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2563eb] transition-colors hover:bg-[#2563eb]/80"
            aria-label="Start recording"
          >
            <span className="h-5 w-5 rounded-full bg-white" />
          </button>
        ) : (
          <>
            {/* Pause / Resume */}
            <button
              onClick={isPaused ? resume : pause}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] transition-colors hover:bg-white/[0.1]"
              aria-label={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? (
                <svg width="16" height="18" viewBox="0 0 16 18" fill="white">
                  <path d="M0 0L16 9L0 18Z" />
                </svg>
              ) : (
                <svg width="14" height="18" viewBox="0 0 14 18" fill="white">
                  <rect x="0" y="0" width="4" height="18" rx="1" />
                  <rect x="10" y="0" width="4" height="18" rx="1" />
                </svg>
              )}
            </button>

            {/* Stop */}
            <button
              onClick={stop}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 transition-colors hover:bg-red-400"
              aria-label="Stop recording"
            >
              <span className="h-5 w-5 rounded-sm bg-white" />
            </button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[13px] text-red-400">{error}</p>
      )}
    </div>
  );
}
