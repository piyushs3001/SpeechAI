"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  message,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <div className="text-center">
        {icon && <div className="mb-3 flex justify-center">{icon}</div>}
        <p className="text-sm font-medium text-gray-400">{message}</p>
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
