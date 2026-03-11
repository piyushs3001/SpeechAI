"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = String(++idCounter);
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string) => toast(message, "success"),
    [toast]
  );
  const error = useCallback(
    (message: string) => toast(message, "error"),
    [toast]
  );
  const info = useCallback(
    (message: string) => toast(message, "info"),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const iconMap: Record<ToastType, ReactNode> = {
    success: <CheckCircle size={16} className="text-green-400 shrink-0" />,
    error: <XCircle size={16} className="text-red-400 shrink-0" />,
    info: <Info size={16} className="text-[#64b5f6] shrink-0" />,
  };

  const borderMap: Record<ToastType, string> = {
    success: "border-green-500/30",
    error: "border-red-500/30",
    info: "border-[#64b5f6]/30",
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-xl border bg-[#1a1a2e] px-4 py-3 shadow-xl transition-all duration-300 ${
        borderMap[toast.type]
      } ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      style={{ minWidth: 260, maxWidth: 380 }}
    >
      {iconMap[toast.type]}
      <p className="flex-1 text-sm text-gray-200">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 text-gray-500 transition-colors hover:text-gray-300"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
