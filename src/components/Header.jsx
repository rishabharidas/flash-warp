import React from 'react';
import { Zap, Wifi, QrCode, MessageSquare, Info, ShieldCheck } from 'lucide-react';

export default function Header({
  roomId,
  isHost,
  connectionStatus,
  connectedPeersCount,
  onOpenQR,
  onOpenChat,
  unreadCount,
}) {
  const renderStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="badge-status connected">
            <span className="pulse-dot emerald"></span>
            <span>{connectedPeersCount} Peer{connectedPeersCount !== 1 ? 's' : ''} Connected</span>
          </div>
        );
      case 'waiting':
        return (
          <div className="badge-status waiting">
            <span className="pulse-dot amber"></span>
            <span>Waiting for Peer...</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="badge-status connecting">
            <span className="pulse-dot cyan"></span>
            <span>Connecting...</span>
          </div>
        );
      case 'error':
        return (
          <div className="badge-status error">
            <span className="pulse-dot" style={{ backgroundColor: '#ef4444' }}></span>
            <span>Connection Error</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header className="w-full max-w-6xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Zap className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-gradient">FlashWarp</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
              P2P LAN
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Direct Browser-to-Browser File Transfer</p>
        </div>
      </div>

      {/* Connection & Room Info */}
      <div className="flex items-center gap-3">
        {renderStatusBadge()}

        {roomId && (
          <button
            onClick={onOpenQR}
            className="btn-secondary text-sm py-2 px-3 flex items-center gap-2 border-cyan-500/30 hover:border-cyan-400"
            title="Show QR Code"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span className="font-mono font-semibold text-cyan-300">{roomId}</span>
          </button>
        )}

        {connectionStatus === 'connected' && (
          <button
            onClick={onOpenChat}
            className="btn-icon relative"
            title="Peer Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted WebRTC</span>
        </div>
      </div>
    </header>
  );
}
