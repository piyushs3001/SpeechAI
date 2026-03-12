"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const SPEEDS = [0.5, 1, 1.5, 2];

export function AudioPlayer({ audioUrl, onTimeUpdate }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    onTimeUpdate?.(audio.currentTime);
  }, [onTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [handleTimeUpdate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  };

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = SPEEDS[next];
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-lg bg-white border border-[#e5e7eb] px-4 py-3 shadow-sm">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white transition-colors hover:bg-[#1d4ed8]"
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="3.5" height="12" rx="1" />
              <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5v11l9-5.5z" />
            </svg>
          )}
        </button>

        {/* Time */}
        <span className="text-[12px] text-[#6b7280] tabular-nums w-[42px] shrink-0">
          {formatTime(currentTime)}
        </span>

        {/* Progress bar */}
        <div
          className="relative flex-1 h-1 rounded-full bg-[#e5e7eb] cursor-pointer group"
          onClick={seek}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#2563eb] transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-[#2563eb] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, marginLeft: "-5px" }}
          />
        </div>

        {/* Duration */}
        <span className="text-[12px] text-[#6b7280] tabular-nums w-[42px] shrink-0 text-right">
          {formatTime(duration)}
        </span>

        {/* Speed */}
        <button
          onClick={cycleSpeed}
          className="shrink-0 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[11px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
        >
          {SPEEDS[speedIndex]}x
        </button>
      </div>
    </div>
  );
}

export function seekAudio(audioRef: React.RefObject<HTMLAudioElement | null>, time: number) {
  if (audioRef.current) {
    audioRef.current.currentTime = time;
  }
}
