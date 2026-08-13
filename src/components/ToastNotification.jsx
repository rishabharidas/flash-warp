import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastNotification({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-xs sm:max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarn = toast.type === 'warn';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-lg border shadow-xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200 ${
              isSuccess
                ? 'bg-[#141417] border-emerald-500/40 text-emerald-300'
                : isError
                ? 'bg-[#141417] border-rose-500/40 text-rose-300'
                : isWarn
                ? 'bg-[#141417] border-amber-500/40 text-amber-300'
                : 'bg-[#1c1c20] border-[#27272a] text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : isError ? (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              )}
              <span className="truncate font-medium">{toast.text}</span>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-zinc-500 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
