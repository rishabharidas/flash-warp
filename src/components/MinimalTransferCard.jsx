import React, { useRef, useState } from 'react';
import { Eye, Trash2, Download, Check, Loader2, Square } from 'lucide-react';
import { formatBytes, getFileTypeCategory, formatSpeed, formatDuration } from '../utils/formatters';

export default function MinimalTransferCard({
  roomId,
  isHost,
  connectionStatus,
  connectedPeers,
  sharedFiles,
  remoteFiles,
  transfers,
  totalBytesTransferred = 0,
  onAddFiles,
  onRemoveFile,
  onOpenQR,
  onOpenChat,
  onOpenTextShare,
  onRequestDownload,
  onCancelTransfer,
  onPreviewFile,
  onJoinRoom,
  chatUnreadCount,
  textShareCount = 0,
}) {
  const [copied, setCopied] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'hosted' | 'remote'
  const fileInputRef = useRef(null);

  const shareUrl = `${window.location.origin}${window.location.pathname}#room=${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };
  const handleDragLeave = () => {
    setIsDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files?.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length > 0) {
      onAddFiles(e.target.files);
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (joinCodeInput.trim()) {
      onJoinRoom(joinCodeInput.trim());
    }
  };

  // Combine shared files and remote files
  const allFilesList = [
    ...sharedFiles.map((f) => ({ ...f, isHosted: true })),
    ...remoteFiles.map((f) => ({ ...f, isHosted: false })),
  ];

  const filteredFiles =
    activeFilter === 'hosted'
      ? allFilesList.filter((f) => f.isHosted)
      : activeFilter === 'remote'
        ? allFilesList.filter((f) => !f.isHosted)
        : allFilesList;

  const isConnected = connectionStatus === 'connected';
  const activeTransfersList = Object.values(transfers || {});

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 py-4 px-2 sm:px-0">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">FlashWarp</h1>
          <p className="text-xs text-zinc-400 font-normal">Local P2P File Transfer</p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold">
              {connectedPeers.length} Peer Connected
            </span>
          ) : (
            <span className="px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium">
              {connectionStatus === 'waiting' ? 'Waiting for device...' : 'Connecting...'}
            </span>
          )}

          {isConnected && (
            <>
              {onOpenTextShare && (
                <button
                  onClick={onOpenTextShare}
                  className="btn-mono text-xs py-1 px-3 relative"
                  title="Share Clipboard / Text"
                >
                  <span>Text / Links</span>
                  {textShareCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-white text-black font-bold rounded-full">
                      {textShareCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={onOpenChat}
                className="btn-mono text-xs py-1 px-3 relative"
                title="Open Chat"
              >
                <span>Chat</span>
                {chatUnreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-white text-black font-bold rounded-full">
                    {chatUnreadCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Mono Card Container */}
      <div className="mono-card p-3">
        {/* Fixed Header Section (Room Key Bar + Connect Input) */}
        <div className="flex-shrink-0 space-y-3 mb-3">
          {/* Room Key Bar */}
          <div className="p-1.5 rounded-lg bg-[#1c1c20] border border-[#27272a] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium px-1.5">Room Key:</span>
              <span className="font-mono font-bold text-white text-xs sm:text-sm tracking-widest px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">
                {roomId || '...'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyLink}
                className="btn-mono text-xs py-1 px-2.5"
              >
                {copied ? 'Copied Link' : 'Copy Link'}
              </button>

              <button
                onClick={onOpenQR}
                className="btn-mono text-xs py-1 px-2.5"
              >
                QR Code
              </button>
            </div>
          </div>

          {/* Connect Room Key Input (if not connected) */}
          {!isConnected && (
            <form onSubmit={handleJoinSubmit} className="space-y-1 flex flex-col">
              <label className="text-[11px] font-medium text-zinc-400 block">Connect to Device</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter Room Key (e.g. FW-8A92)..."
                  className="mono-input flex-1 font-mono uppercase text-xs tracking-wider"
                />
                <button type="submit" className="btn-mono-white text-xs whitespace-nowrap px-4">
                  Connect
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Content Section */}
        {allFilesList.length === 0 ? (
          /* Full Height Dropzone when no files added */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 mono-dropzone p-6 text-center select-none flex flex-col items-center justify-center ${
              isDragActive ? 'drag-active' : ''
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isDragActive ? 'Drop files to send' : 'Add files to send'}
              </h3>
              <p className="text-xs text-zinc-400">
                Drag & drop files here, or click to choose from your device
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Compact Top Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-shrink-0 mono-dropzone py-3.5 sm:py-4 px-4 mb-3 text-center select-none ${
                isDragActive ? 'drag-active' : ''
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  {isDragActive ? 'Drop files to send' : 'Add files to send'}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Drag & drop files here, or click to choose from your device
                </p>
              </div>
            </div>

            {/* Scrollable Files List Section ONLY */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scroll flex flex-col space-y-3">
              {/* Files Section Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#27272a] sticky top-0 bg-[#141417] z-10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${activeFilter === 'all'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-white'
                      }`}
                  >
                    All Files ({allFilesList.length})
                  </button>
                  {sharedFiles.length > 0 && (
                    <button
                      onClick={() => setActiveFilter('hosted')}
                      className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${activeFilter === 'hosted'
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                      Hosted ({sharedFiles.length})
                    </button>
                  )}
                  {remoteFiles.length > 0 && (
                    <button
                      onClick={() => setActiveFilter('remote')}
                      className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${activeFilter === 'remote'
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                      Remote ({remoteFiles.length})
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-zinc-500">
                  Click to download
                </span>
              </div>

            {/* Files List Items */}
            {filteredFiles.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No files shared yet. Add files above.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredFiles.map((file) => {
                  const transferState = Object.values(transfers).find(
                    (t) => t.fileId === file.id || t.fileName === file.name
                  );

                  const isTransferring = transferState && transferState.status === 'transferring';
                  const isCompleted = transferState && transferState.status === 'completed';
                  const isCancelled = transferState && transferState.status === 'cancelled';

                  return (
                    <div
                      key={file.id}
                      className="p-3 rounded-lg bg-[#1c1c20] border border-[#27272a] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate" title={file.name}>
                            {file.name}
                          </h4>
                          <span className="text-[10px] text-zinc-400 font-mono flex-shrink-0">
                            {file.isHosted ? '(Host)' : '(Remote)'}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono block">
                          {formatBytes(file.size)}
                        </span>
                      </div>

                      {/* Icon Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {onPreviewFile && (
                          <button
                            onClick={() => onPreviewFile(file)}
                            className="p-1.5 rounded bg-[#141417] border border-[#27272a] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                            title="Preview file"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {file.isHosted ? (
                          <div className="flex items-center gap-1.5">
                            {isCompleted ? (
                              <span className="text-xs text-emerald-400 font-mono font-medium px-2 py-1 bg-[#141417] rounded border border-emerald-900/40 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Sent</span>
                              </span>
                            ) : null}
                            <button
                              onClick={() => onRemoveFile(file.id)}
                              className="p-1.5 rounded bg-[#141417] border border-[#27272a] text-zinc-400 hover:text-rose-400 hover:border-rose-500/50 transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isCompleted ? (
                          <a
                            href={transferState.url}
                            download={file.name}
                            className="btn-mono-white text-xs py-1 px-2.5 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Save</span>
                          </a>
                        ) : isTransferring ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white font-mono font-bold px-2.5 py-1 bg-[#141417] rounded border border-[#27272a] flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>{Math.round(transferState.progress || 0)}%</span>
                            </span>
                            {onCancelTransfer && (
                              <button
                                onClick={() => onCancelTransfer(transferState.id)}
                                className="p-1.5 rounded bg-[#141417] border border-rose-900/50 text-rose-400 hover:bg-rose-900/40 transition-colors"
                                title="Stop transfer"
                              >
                                <Square className="w-3 h-3 fill-rose-400" />
                              </button>
                            )}
                          </div>
                        ) : isCancelled ? (
                          <span className="text-xs text-zinc-400 font-mono px-2.5 py-1 bg-[#141417] rounded border border-zinc-800">
                            Stopped
                          </span>
                        ) : (
                          <button
                            onClick={() => onRequestDownload(file.id)}
                            className="btn-mono-white text-xs py-1 px-2.5 flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Live Transfer Progress Bar */}
            {activeTransfersList.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-[#27272a]">
                {activeTransfersList.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg bg-[#1c1c20] border border-zinc-700 space-y-2">
                    <div className="flex justify-between items-center text-xs font-medium text-white">
                      <span className="truncate max-w-[200px]">{t.fileName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">
                          {t.status === 'completed'
                            ? '100%'
                            : t.status === 'cancelled'
                              ? 'Stopped'
                              : `${Math.round(t.progress || 0)}%`}
                        </span>
                        {t.status === 'transferring' && onCancelTransfer && (
                          <button
                            onClick={() => onCancelTransfer(t.id)}
                            className="p-1 rounded bg-[#141417] border border-rose-900/50 text-rose-400 hover:bg-rose-900/40 transition-colors"
                            title="Stop transfer"
                          >
                            <Square className="w-3 h-3 fill-rose-400" />
                          </button>
                        )}
                        {t.status === 'completed' && (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                    </div>
                    {t.status === 'transferring' && (
                      <>
                        <div className="w-full h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white transition-all duration-150"
                            style={{ width: `${Math.min(100, t.progress || 0)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                          <span>{formatSpeed(t.speed)}</span>
                          <span>ETA: {formatDuration(t.eta)}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>

      {/* Simple Footer with Session Statistics */}
      <div className="text-center text-[11px] text-zinc-500 font-mono flex items-center justify-center gap-2">
        <span>FlashWarp P2P</span>
        <span>•</span>
        <span>Direct Local Transfer</span>
        {totalBytesTransferred > 0 && (
          <>
            <span>•</span>
            <span className="text-zinc-400 font-semibold">{formatBytes(totalBytesTransferred)} Transferred</span>
          </>
        )}
      </div>
    </div>
  );
}
