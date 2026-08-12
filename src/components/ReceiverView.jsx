import React, { useState } from 'react';
import { QrCode, Camera, Download, Wifi, Search, Archive, Layers } from 'lucide-react';
import JSZip from 'jszip';
import FileCard from './FileCard';

export default function ReceiverView({
  connectionStatus,
  errorMsg,
  remoteFiles,
  transfers,
  onJoinRoom,
  onOpenScanner,
  onRequestDownload,
  onPreviewFile,
}) {
  const [inputRoomId, setInputRoomId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isZipping, setIsZipping] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (inputRoomId.trim()) {
      onJoinRoom(inputRoomId.trim());
    }
  };

  const filteredFiles = remoteFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isConnected = connectionStatus === 'connected';

  // Batch download all files as a single zip archive using JSZip
  const handleDownloadAllZip = async () => {
    if (remoteFiles.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder('FlashWarp-Files');

      // Request each file download
      for (const file of remoteFiles) {
        onRequestDownload(file.id);
      }

      // Poll until all downloads finish
      const checkFinished = setInterval(async () => {
        const completedTransfers = Object.values(transfers).filter(
          (t) => t.status === 'completed' && t.blob
        );

        if (completedTransfers.length >= remoteFiles.length) {
          clearInterval(checkFinished);
          completedTransfers.forEach((t) => {
            folder.file(t.fileName, t.blob);
          });
          const content = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(content);
          const link = document.createElement('a');
          link.href = url;
          link.download = `FlashWarp-Files-${Date.now()}.zip`;
          link.click();
          setIsZipping(false);
        }
      }, 500);
    } catch (err) {
      console.error('ZIP generation error:', err);
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Join Room Form if not connected */}
      {!isConnected && (
        <div className="glass-panel p-8 max-w-xl mx-auto text-center space-y-6">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Wifi className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-100">Connect to Device</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter the Room Code or scan the QR Code from the Host device on your network.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                placeholder="e.g. FW-8A92"
                maxLength={10}
                className="glass-input uppercase font-mono tracking-widest text-center text-lg font-bold text-cyan-300"
              />
              <button
                type="button"
                onClick={onOpenScanner}
                className="btn-secondary py-3 px-4 flex items-center justify-center border-cyan-500/30 text-cyan-400"
                title="Scan QR Code via Camera"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <button
              type="submit"
              disabled={connectionStatus === 'connecting'}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              {connectionStatus === 'connecting' ? (
                <span>Connecting to Host...</span>
              ) : (
                <span>Join Host Session</span>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Connected Explorer */}
      {isConnected && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="glass-panel p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h2 className="text-xl font-bold text-slate-100">Remote Shared Files</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Browse & download files directly from the Host device.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {remoteFiles.length > 0 && (
                <button
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="btn-secondary py-2.5 px-4 text-xs font-bold text-cyan-300 border-cyan-500/30 flex items-center gap-2"
                >
                  <Archive className="w-4 h-4 text-cyan-400" />
                  <span>{isZipping ? 'Zipping Files...' : 'Download All (.zip)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          {remoteFiles.length > 0 && (
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files by name..."
                className="glass-input text-xs pl-10 py-2.5"
              />
            </div>
          )}

          {/* Files Grid */}
          {filteredFiles.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-500 space-y-2">
              <Layers className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-medium">No files available from host.</p>
              <p className="text-xs">The host has not added any files yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => {
                // Find matching transfer state if any
                const matchingTransfer = Object.values(transfers).find(
                  (t) => t.fileId === file.id || t.fileName === file.name
                );

                return (
                  <FileCard
                    key={file.id}
                    file={file}
                    isHost={false}
                    transferState={matchingTransfer}
                    onDownload={onRequestDownload}
                    onPreview={onPreviewFile}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
