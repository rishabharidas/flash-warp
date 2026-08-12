import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw } from 'lucide-react';

export default function QRScannerModal({ onScanSuccess, onClose }) {
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef(null);
  const readerId = 'html5-qr-reader';

  useEffect(() => {
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(readerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (decodedText) => {
            // Stop scanning on success
            html5QrCode
              .stop()
              .catch(() => {})
              .then(() => {
                onScanSuccess(decodedText);
              });
          },
          () => {
            // Frame scan failure - ignore
          }
        );
        setIsInitializing(false);
      } catch (err) {
        console.error('Camera QR scanner error:', err);
        setError('Camera permission denied or camera unavailable.');
        setIsInitializing(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content relative text-center max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-2">
          <Camera className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Scan Room QR Code</h2>
        <p className="text-xs text-slate-400 mb-4">
          Point your camera at the QR code displayed on the host device screen.
        </p>

        {/* Camera Scanner Box */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[260px] flex items-center justify-center">
          {isInitializing && (
            <div className="flex flex-col items-center gap-2 text-cyan-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-xs text-slate-400">Starting Camera...</span>
            </div>
          )}

          {error ? (
            <div className="p-6 text-red-400 text-xs text-center">
              {error}
            </div>
          ) : (
            <div id={readerId} className="w-full h-full" />
          )}
        </div>
      </div>
    </div>
  );
}
