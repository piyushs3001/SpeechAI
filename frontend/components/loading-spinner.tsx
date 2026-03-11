"use client";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({
  message,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <div className="text-center">
        <div className="mb-3 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-gray-600 border-t-[#64b5f6]" />
        {message && <p className="text-sm text-gray-400">{message}</p>}
      </div>
    </div>
  );
}
