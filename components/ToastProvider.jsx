"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg, dur) => addToast(msg, "success", dur),
    error: (msg, dur) => addToast(msg, "error", dur),
    info: (msg, dur) => addToast(msg, "info", dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 transform translate-y-0 motion-reduce:transition-none ${
              t.type === "success"
                ? "bg-emerald-50/95 dark:bg-[#091f1a]/95 border-emerald-500/40 text-emerald-900 dark:text-emerald-100 shadow-emerald-500/10"
                : t.type === "error"
                ? "bg-rose-50/95 dark:bg-[#200f14]/95 border-rose-500/40 text-rose-900 dark:text-rose-100 shadow-rose-500/10"
                : "bg-teal-50/95 dark:bg-[#0a1a1f]/95 border-teal-500/40 text-teal-900 dark:text-teal-100 shadow-teal-500/10"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              )}
              {t.type === "info" && (
                <Info className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              )}
            </div>
            <p className="text-sm font-medium leading-relaxed flex-1 text-slate-800 dark:text-slate-100">
              {t.message}
            </p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
