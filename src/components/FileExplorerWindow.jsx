import React, { useState, useRef } from 'react';
import {
  Folder,
  Download,
  UploadCloud,
  QrCode,
  Search,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Eye,
  CheckCircle2,
  Loader2,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  File,
  HardDrive,
  Wifi,
  ShieldCheck,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { formatBytes, getFileTypeCategory } from '../utils/formatters';
import FileCard from './FileCard';

export default function FileExplorerWindow({
  activeTab,
  setActiveTab,
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
  onOpenScanner,
  onOpenChat,
  onRequestDownload,
  onPreviewFile,
  onJoinRoom,
  errorMsg,
}) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const activeFiles = activeTab === 'host' ? sharedFiles : remoteFiles;
  const filteredFiles = activeFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBytes = activeFiles.reduce((acc, f) => acc + (f.size || 0), 0);

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
    if (activeTab === 'host' && e.dataTransfer.files?.length > 0) {
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
    if (joinInput.trim()) {
      onJoinRoom(joinInput.trim());
    }
  };

  const renderFileIcon = (type, name) => {
    const category = getFileTypeCategory(type, name);
    switch (category) {
      case 'image':
        return <Image className="w-4 h-4 text-sky-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-pink-400" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'code':
        return <Code className="w-4 h-4 text-emerald-400" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-amber-400" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="explorer-window w-full max-w-5xl mx-auto my-4 flex flex-col min-h-[640px]"
    >
      {/* Top Address & Controls Bar */}
      <div className="explorer-header px-4 py-3 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Window control buttons + Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-[#0b0e14] border border-[#232d3f] text-xs text-slate-400 font-mono">
            <span className="text-slate-500">flashwarp://</span>
            <span className="text-sky-400 font-medium">local-lan</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 font-semibold">{roomId || 'disconnected'}</span>
          </div>
        </div>

        {/* Status Pill & Action Buttons */}
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{connectedPeers.length} Connected</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>{connectionStatus === 'waiting' ? 'Waiting for peer...' : connectionStatus}</span>
            </span>
          )}

          {roomId && (
            <button
              onClick={onOpenQR}
              className="btn-explorer text-xs py-1.5 px-2.5 text-sky-400 border-sky-500/30"
              title="Show QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="font-mono font-bold">{roomId}</span>
            </button>
          )}

          {connectionStatus === 'connected' && (
            <button
              onClick={onOpenChat}
              className="btn-explorer text-xs py-1.5 px-2.5 text-slate-300"
              title="Open Peer Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            </button>
          )}
        </div>
      </div>

      {/* Main Split Explorer Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[500px]">
        {/* Left Sidebar */}
        <div className="explorer-sidebar w-full md:w-56 p-3 flex flex-col justify-between select-none">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Navigation
            </div>

            <button
              onClick={() => setActiveTab('host')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
                activeTab === 'host'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                  : 'text-slate-400 hover:bg-[#161c27] hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-sky-400" />
              <span>Host Files</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {sharedFiles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('join')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
                activeTab === 'join'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold'
                  : 'text-slate-400 hover:bg-[#161c27] hover:text-slate-200'
              }`}
            >
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>Remote Files</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {remoteFiles.length}
              </span>
            </button>
          </div>

          {/* Quick Join box in sidebar if not connected */}
          {activeTab === 'join' && connectionStatus !== 'connected' && (
            <div className="mt-4 p-3 rounded-xl bg-[#121721] border border-[#232d3f] space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 block">Connect Room</span>
              <form onSubmit={handleJoinSubmit} className="space-y-2">
                <input
                  type="text"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                  placeholder="e.g. FW-8A92"
                  className="explorer-input w-full text-xs font-mono py-1.5 px-2 uppercase text-center"
                />
                <div className="flex gap-1.5">
                  <button type="submit" className="btn-explorer-primary w-full text-xs py-1 justify-center">
                    Join
                  </button>
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="btn-explorer text-xs py-1 px-2 text-sky-400"
                    title="Camera Scanner"
                  >
                    Scan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sidebar Footer info */}
          <div className="mt-6 pt-3 border-t border-[#19202d] text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct LAN Encrypted</span>
            </div>
            <p className="text-[10px] text-slate-600">No cloud server upload</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-[#121721] overflow-hidden">
          {/* Top Explorer Toolbar */}
          <div className="p-3 border-b border-[#232d3f] bg-[#161c27] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {activeTab === 'host' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-explorer-primary text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Files</span>
                  </button>
                </>
              )}

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter files..."
                  className="explorer-input pl-8 py-1.5 text-xs w-44 sm:w-56"
                />
              </div>
            </div>

            {/* View Switcher (Grid vs List) */}
            <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-lg border border-[#232d3f]">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-[#1c2333] text-sky-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-[#1c2333] text-sky-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Files Content Area */}
          <div className="flex-1 p-4 overflow-y-auto relative">
            {/* Drag & drop overlay for host mode */}
            {activeTab === 'host' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`dropzone-area p-4 mb-4 text-center cursor-pointer ${
                  isDragActive ? 'drag-active' : ''
                }`}
              >
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <UploadCloud className="w-4 h-4 text-sky-400" />
                  <span>
                    {isDragActive
                      ? 'Drop files now to add to room'
                      : 'Drag & Drop files here, or click to add'}
                  </span>
                </div>
              </div>
            )}

            {filteredFiles.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Folder className="w-10 h-10 mx-auto text-slate-700 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-400">
                  {activeTab === 'host' ? 'No files hosted in this session.' : 'No files shared by host yet.'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid Layout */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    isHost={activeTab === 'host'}
                    transferState={Object.values(transfers).find(
                      (t) => t.fileId === file.id || t.fileName === file.name
                    )}
                    onDownload={onRequestDownload}
                    onPreview={onPreviewFile}
                    onRemove={onRemoveFile}
                  />
                ))}
              </div>
            ) : (
              /* Table List Layout */
              <div className="w-full text-left text-xs">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-semibold text-slate-500 border-b border-[#232d3f] uppercase tracking-wider select-none">
                  <div className="col-span-6 sm:col-span-7">Name</div>
                  <div className="col-span-3 sm:col-span-3">Size</div>
                  <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-[#19202d]">
                  {filteredFiles.map((file) => {
                    const transferState = Object.values(transfers).find(
                      (t) => t.fileId === file.id || t.fileName === file.name
                    );

                    const isTransferring = transferState && transferState.status === 'transferring';
                    const isCompleted = transferState && transferState.status === 'completed';

                    return (
                      <div
                        key={file.id}
                        className="file-row grid grid-cols-12 gap-2 px-3 py-2.5 items-center group"
                      >
                        <div className="col-span-6 sm:col-span-7 flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded bg-[#0b0e14] border border-[#232d3f]">
                            {renderFileIcon(file.type, file.name)}
                          </div>
                          <span
                            className="font-medium text-slate-200 truncate group-hover:text-sky-300 transition-colors"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        </div>

                        <div className="col-span-3 sm:col-span-3 text-slate-400 font-mono text-[11px]">
                          {formatBytes(file.size)}
                        </div>

                        <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1.5">
                          {onPreviewFile && (
                            <button
                              onClick={() => onPreviewFile(file)}
                              className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-[#1c2333]"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {activeTab === 'host' ? (
                            <button
                              onClick={() => onRemoveFile(file.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1c2333]"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : isCompleted ? (
                            <a
                              href={transferState.url}
                              download={file.name}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Save</span>
                            </a>
                          ) : isTransferring ? (
                            <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>{Math.round(transferState.progress || 0)}%</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => onRequestDownload(file.id)}
                              className="btn-explorer-primary py-0.5 px-2 text-[11px]"
                            >
                              <Download className="w-3 h-3" />
                              <span>Get</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Status Bar */}
          <div className="px-4 py-2 border-t border-[#232d3f] bg-[#0b0e14] flex flex-wrap items-center justify-between text-[11px] text-slate-500 select-none">
            <div className="flex items-center gap-3">
              <span>{filteredFiles.length} items</span>
              <span>•</span>
              <span>{formatBytes(totalBytes)}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>PeerJS WebRTC LAN Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
