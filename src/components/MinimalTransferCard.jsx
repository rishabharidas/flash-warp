import React, { useRef, useState } from 'react';
import { Eye, Trash2, Download, Check, Loader2 } from 'lucide-react';
import { formatBytes, getFileTypeCategory, formatSpeed, formatDuration } from '../utils/formatters';

export default function MinimalTransferCard({
  roomId,
  isHost,
  connectionStatus,
  connectedPeers,
  sharedFiles,
  remoteFiles,
  transfers,
  onAddFiles,
  onRemoveFile,
  onOpenQR,
  onOpenChat,
  onRequestDownload,
  onPreviewFile,
  onJoinRoom,
  chatUnreadCount,
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
    <div className="w-full max-w-3xl mx-auto my-auto space-y-7 py-8">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">FlashWarp</h1>
          <p className="text-sm text-zinc-400 font-normal mt-1">Local P2P File Transfer</p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <span className="px-4 py-2 rounded-[8px] bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold">
              {connectedPeers.length} Peer Connected
            </span>
          ) : (
            <span className="px-4 py-2 rounded-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium">
              {connectionStatus === 'waiting' ? 'Waiting for device...' : 'Connecting...'}
            </span>
          )}

          {isConnected && (
            <button
              onClick={onOpenChat}
              className="btn-mono text-xs py-2 px-4 relative"
              title="Open Chat"
            >
              <span>Chat</span>
              {chatUnreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-white text-black font-bold rounded-full">
                  {chatUnreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Mono Card Container */}
      <div className="mono-card p-6 sm:p-8">
        {/* Fixed Header Section (Room Key Bar + Connect Input) */}
        <div className="flex-shrink-0 space-y-6 mb-8">
          {/* Room Key Bar */}
          <div className="p-5 sm:p-6 rounded-[8px] bg-[#1c1c20] border border-[#27272a] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400 font-medium">Room Key:</span>
              <span className="font-mono font-bold text-white text-base tracking-widest px-3 py-1 rounded-[6px] bg-zinc-900 border border-zinc-700">
                {roomId || '...'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="btn-mono text-xs py-2.5 px-4"
              >
                {copied ? 'Copied Link' : 'Copy Link'}
              </button>

              <button
                onClick={onOpenQR}
                className="btn-mono text-xs py-2.5 px-4"
              >
                QR Code
              </button>
            </div>
          </div>

          {/* Connect Room Key Input (if not connected) */}
          {!isConnected && (
            <form onSubmit={handleJoinSubmit} className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 block">Connect to Device</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter Room Key (e.g. FW-8A92)..."
                  className="mono-input flex-1 font-mono uppercase text-sm tracking-wider"
                />
                <button type="submit" className="btn-mono-white text-sm whitespace-nowrap">
                  Connect
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Scrollable Content Body with 5px Custom Scrollbar */}
        <div className="flex-1 overflow-y-auto pr-1.5 custom-scroll flex flex-col space-y-8">
          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mono-dropzone ${filteredFiles.length === 0 ? 'flex-1 py-14' : 'py-10'} px-6 text-center select-none ${isDragActive ? 'drag-active' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">
                {isDragActive ? 'Drop files to send' : 'Add files to send'}
              </h3>
              <p className="text-xs text-zinc-400">
                Drag & drop files here, or click to choose from your device
              </p>
            </div>
          </div>

          {/* Files Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#27272a]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`text-xs font-medium px-3.5 py-1.5 rounded-[6px] transition-colors ${activeFilter === 'all'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  All Files ({allFilesList.length})
                </button>
                {sharedFiles.length > 0 && (
                  <button
                    onClick={() => setActiveFilter('hosted')}
                    className={`text-xs font-medium px-3.5 py-1.5 rounded-[6px] transition-colors ${activeFilter === 'hosted'
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
                    className={`text-xs font-medium px-3.5 py-1.5 rounded-[6px] transition-colors ${activeFilter === 'remote'
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                      }`}
                  >
                    Remote ({remoteFiles.length})
                  </button>
                )}
              </div>

              <span className="text-xs text-zinc-500">
                {allFilesList.length > 0 ? 'Click to download' : 'No files added'}
              </span>
            </div>

            {/* Files List Items (Spacious item padding & clean icon buttons) */}
            {filteredFiles.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500">
                No files shared yet. Add files above.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFiles.map((file) => {
                  const transferState = Object.values(transfers).find(
                    (t) => t.fileId === file.id || t.fileName === file.name
                  );

                  const isTransferring = transferState && transferState.status === 'transferring';
                  const isCompleted = transferState && transferState.status === 'completed';

                  return (
                    <div
                      key={file.id}
                      className="p-5 sm:p-6 rounded-[8px] bg-[#1c1c20] border border-[#27272a] flex items-center justify-between gap-5"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-sm font-semibold text-white truncate" title={file.name}>
                            {file.name}
                          </h4>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {file.isHosted ? '(Host)' : '(Remote)'}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 font-mono block">
                          {formatBytes(file.size)}
                        </span>
                      </div>

                      {/* Icon Actions (Small Eye & Trash icons) */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {onPreviewFile && (
                          <button
                            onClick={() => onPreviewFile(file)}
                            className="p-2.5 rounded-[6px] bg-[#141417] border border-[#27272a] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        {file.isHosted ? (
                          <button
                            onClick={() => onRemoveFile(file.id)}
                            className="p-2.5 rounded-[6px] bg-[#141417] border border-[#27272a] text-zinc-400 hover:text-rose-400 hover:border-rose-500/50 transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : isCompleted ? (
                          <a
                            href={transferState.url}
                            download={file.name}
                            className="btn-mono-white text-xs py-2 px-4 flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </a>
                        ) : isTransferring ? (
                          <span className="text-xs text-white font-mono font-bold px-3 py-1 bg-[#141417] rounded-[6px] border border-[#27272a] flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{Math.round(transferState.progress || 0)}%</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onRequestDownload(file.id)}
                            className="btn-mono-white text-xs py-2 px-4 flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Transfer Progress Bar */}
          {activeTransfersList.length > 0 && (
            <div className="space-y-4 pt-5 border-t border-[#27272a]">
              {activeTransfersList.map((t) => (
                <div key={t.id} className="p-5 rounded-[8px] bg-[#1c1c20] border border-zinc-700 space-y-3">
                  <div className="flex justify-between text-xs font-medium text-white">
                    <span className="truncate max-w-[280px]">{t.fileName}</span>
                    <span className="font-mono font-bold">
                      {t.status === 'completed' ? '100%' : `${Math.round(t.progress || 0)}%`}
                    </span>
                  </div>
                  {t.status !== 'completed' && (
                    <>
                      <div className="w-full h-2 bg-[#27272a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-150"
                          style={{ width: `${Math.min(100, t.progress || 0)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
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
      </div>

      {/* Simple Footer */}
      <div className="text-center text-xs text-zinc-500">
        FlashWarp P2P • Direct Local Network Transfer
      </div>
    </div>
  );
}
