import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Share2, Smartphone } from 'lucide-react';

export default function QRCodeModal({ roomId, onClose }) {
  const [copied, setCopied] = useState(false);

  // Construct shareable URL with room ID in hash
  const shareUrl = `${window.location.origin}${window.location.pathname}#room=${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content relative text-center" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-3">
          <Smartphone className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Scan to Connect Device</h2>
        <p className="text-xs text-slate-400 mb-6">
          Scan this QR code with any mobile camera on the same Wi-Fi network to transfer files instantly.
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl inline-block shadow-xl shadow-cyan-500/10 border-4 border-slate-800 mb-6">
          <QRCodeSVG
            value={shareUrl}
            size={220}
            bgColor="#FFFFFF"
            fgColor="#090D16"
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Room Code & Copy Link */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-300 font-medium">
            <span>Room Code:</span>
            <span className="font-mono font-bold text-cyan-400 text-lg px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              {roomId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="glass-input text-xs text-slate-300 py-2.5"
            />
            <button
              onClick={handleCopyLink}
              className="btn-primary text-xs py-2.5 px-4 whitespace-nowrap flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
