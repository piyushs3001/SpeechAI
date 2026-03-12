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
        <div className="mb-3 h-6 w-6 mx-auto animate-spin rounded-full border-2 border-gray-700 border-t-[#2563eb]" />
        {message && <p className="text-[13px] text-gray-500">{message}</p>}
      </div>
    </div>
  );
}
