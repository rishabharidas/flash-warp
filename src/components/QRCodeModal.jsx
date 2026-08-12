import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeModal({ roomId, onClose }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}${window.location.pathname}#room=${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card relative text-center p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xs font-mono"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-lg font-bold text-white mb-1">Scan Room QR Code</h2>
        <p className="text-xs text-zinc-400 mb-5">
          Scan with your phone camera to open session link instantly.
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-xl inline-block border-2 border-zinc-700 mb-5">
          <QRCodeSVG
            value={shareUrl}
            size={200}
            bgColor="#FFFFFF"
            fgColor="#000000"
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Room Code & Copy Link */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-300">
            <span>Room Key:</span>
            <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-zinc-800">
              {roomId}
            </span>
          </div>

          <button
            onClick={handleCopyLink}
            className="btn-mono-white w-full py-2 text-xs justify-center"
          >
            {copied ? 'Copied Link to Clipboard' : 'Copy Direct Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
