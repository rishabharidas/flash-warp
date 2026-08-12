import React, { useState, useEffect } from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { getFileTypeCategory, formatBytes } from '../utils/formatters';

export default function MediaPreviewModal({ file, blobUrl, onClose, onDownload }) {
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const category = getFileTypeCategory(file.type, file.name);

  // If host previewing local File object, create object URL
  const [previewUrl, setPreviewUrl] = useState(blobUrl || '');

  useEffect(() => {
    let createdUrl = null;
    if (!blobUrl && file.file) {
      createdUrl = URL.createObjectURL(file.file);
      setPreviewUrl(createdUrl);
    } else if (blobUrl) {
      setPreviewUrl(blobUrl);
    }

    // If text/code file, fetch and display text
    if (category === 'code' || category === 'pdf') {
      const sourceFile = file.file || file.blob;
      if (sourceFile && category === 'code') {
        setLoadingText(true);
        const reader = new FileReader();
        reader.onload = (e) => {
          setTextContent(e.target.result.slice(0, 100000)); // limit 100KB for preview
          setLoadingText(false);
        };
        reader.readAsText(sourceFile);
      }
    }

    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [file, blobUrl, category]);

  const renderContent = () => {
    switch (category) {
      case 'image':
        return (
          <div className="flex items-center justify-center max-h-[70vh] overflow-hidden">
            <img
              src={previewUrl}
              alt={file.name}
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center max-h-[70vh] w-full">
            <video
              src={previewUrl}
              controls
              autoPlay
              className="max-h-[70vh] w-full rounded-xl bg-black shadow-2xl"
            />
          </div>
        );

      case 'audio':
        return (
          <div className="p-8 flex flex-col items-center justify-center gap-6 bg-slate-900/90 rounded-2xl border border-slate-800">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20 animate-pulse">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-200">{file.name}</p>
            <audio src={previewUrl} controls autoPlay className="w-full max-w-md" />
          </div>
        );

      case 'code':
        return (
          <div className="max-h-[60vh] overflow-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 leading-relaxed text-left whitespace-pre-wrap">
            {loadingText ? 'Loading text preview...' : textContent || 'Empty text file'}
          </div>
        );

      default:
        return (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-4">
            <p className="text-sm text-slate-400">
              Preview is not available for this file type.
            </p>
            {previewUrl && (
              <a
                href={previewUrl}
                download={file.name}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </a>
            )}
          </div>
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-3xl w-full relative p-6 bg-slate-950/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="min-w-0 pr-4">
            <h3 className="text-lg font-bold text-slate-100 truncate">{file.name}</h3>
            <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
          </div>

          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={() => onDownload(file.id)}
                className="btn-primary text-xs py-2 px-3"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-icon w-9 h-9 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {renderContent()}
      </div>
    </div>
  );
}
