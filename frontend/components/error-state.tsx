"use client";

import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <div className="text-center">
        <AlertCircle
          size={40}
          className="mx-auto mb-3 text-red-400/70"
        />
        <p className="text-sm text-gray-400">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[rgba(255,255,255,0.12)]"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
