import React from 'react';
import { Activity, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatBytes, formatSpeed, formatDuration } from '../utils/formatters';

export default function TransferProgressModal({ transfers }) {
  const transferList = Object.values(transfers || {});

  if (transferList.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm space-y-3 pointer-events-auto">
      {transferList.map((item) => {
        const isCompleted = item.status === 'completed';
        const isError = item.status === 'error';

        return (
          <div
            key={item.id}
            className="glass-panel p-4 shadow-2xl border border-cyan-500/20 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`p-1.5 rounded-lg text-xs font-bold ${
                    item.isOutgoing
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}
                >
                  {item.isOutgoing ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-200 truncate" title={item.fileName}>
                  {item.fileName}
                </span>
              </div>

              {isCompleted && (
                <span className="text-emerald-400 flex items-center gap-1 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Done</span>
                </span>
              )}
              {isError && (
                <span className="text-red-400 flex items-center gap-1 text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Error</span>
                </span>
              )}
            </div>

            {/* Stats row */}
            {!isCompleted && !isError && (
              <>
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono mb-1.5">
                  <span className="text-cyan-300 font-bold">{formatSpeed(item.speed)}</span>
                  <span>
                    {formatBytes(item.bytesTransferred || 0)} / {formatBytes(item.totalBytes || item.fileSize)}
                  </span>
                  <span>ETA: {formatDuration(item.eta)}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full progress-bar-fill transition-all duration-150"
                    style={{ width: `${Math.min(100, item.progress || 0)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
