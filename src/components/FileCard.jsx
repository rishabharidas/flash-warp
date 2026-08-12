import React from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  File,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { formatBytes, getFileTypeCategory } from '../utils/formatters';

export default function FileCard({
  file,
  isHost,
  transferState,
  onDownload,
  onPreview,
  onRemove,
}) {
  const category = getFileTypeCategory(file.type, file.name);

  const renderIcon = () => {
    switch (category) {
      case 'image':
        return <Image className="w-5 h-5 text-cyan-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-pink-400" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-400" />;
      case 'code':
        return <Code className="w-5 h-5 text-emerald-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-amber-400" />;
      default:
        return <File className="w-5 h-5 text-blue-400" />;
    }
  };

  const isTransferring = transferState && transferState.status === 'transferring';
  const isCompleted = transferState && transferState.status === 'completed';

  return (
    <div className="glass-card p-4 flex flex-col justify-between relative group">
      {/* File Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex-shrink-0">
          {renderIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <h4
            className="text-sm font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors"
            title={file.name}
          >
            {file.name}
          </h4>
          <span className="text-xs text-slate-400 font-medium">
            {formatBytes(file.size)}
          </span>
        </div>
      </div>

      {/* Transfer Progress Bar if transferring */}
      {isTransferring && (
        <div className="my-2">
          <div className="flex justify-between text-[11px] font-semibold text-cyan-400 mb-1">
            <span>Transferring...</span>
            <span>{Math.round(transferState.progress || 0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full progress-bar-fill transition-all duration-200"
              style={{ width: `${transferState.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2">
        <div className="flex items-center gap-1.5">
          {onPreview && (
            <button
              onClick={() => onPreview(file)}
              className="btn-icon w-8 h-8 text-slate-400 hover:text-cyan-400"
              title="Preview File"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          {isHost && onRemove && (
            <button
              onClick={() => onRemove(file.id)}
              className="btn-icon w-8 h-8 text-slate-400 hover:text-red-400"
              title="Remove File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div>
          {!isHost && (
            isCompleted ? (
              <a
                href={transferState.url}
                download={file.name}
                className="btn-secondary py-1.5 px-3 text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Save</span>
              </a>
            ) : isTransferring ? (
              <span className="text-xs text-cyan-400 flex items-center gap-1 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Receiving...</span>
              </span>
            ) : (
              <button
                onClick={() => onDownload(file.id)}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
