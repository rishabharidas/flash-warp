import React, { useRef, useState } from 'react';
import { UploadCloud, FolderPlus, QrCode, HardDrive, ShieldCheck, Share2, Layers } from 'lucide-react';
import FileCard from './FileCard';

export default function HostView({
  roomId,
  connectionStatus,
  connectedPeers,
  sharedFiles,
  transfers,
  onAddFiles,
  onRemoveFile,
  onOpenQR,
  onPreviewFile,
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="glass-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <h2 className="text-xl font-bold text-slate-100">Host Network Room</h2>
          </div>
          <p className="text-xs text-slate-400">
            Files added here are served directly from browser RAM to connected devices on your network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenQR}
            className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
          >
            <QrCode className="w-4 h-4 text-slate-950" />
            <span>Show QR Code</span>
          </button>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`dropzone ${isDragOver ? 'active' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">
              Drag & Drop Files Here
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              or click to browse from computer (Any file size supported)
            </p>
          </div>
        </div>
      </div>

      {/* Shared Files Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Hosted Files ({sharedFiles.length})
            </h3>
          </div>
          {sharedFiles.length > 0 && (
            <span className="text-xs text-slate-400">
              Ready for client download
            </span>
          )}
        </div>

        {sharedFiles.length === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-500 space-y-2">
            <HardDrive className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
            <p className="text-sm font-medium">No files added to room yet.</p>
            <p className="text-xs">Drag and drop files above to start sharing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isHost={true}
                onRemove={onRemoveFile}
                onPreview={onPreviewFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
