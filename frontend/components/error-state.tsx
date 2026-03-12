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
          size={36}
          className="mx-auto mb-3 text-red-400/60"
        />
        <p className="text-[14px] text-gray-400">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-gray-300 transition-colors hover:bg-white/[0.1]"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
