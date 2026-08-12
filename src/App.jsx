import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useWebRTC } from './hooks/useWebRTC';
import Header from './components/Header';
import HostView from './components/HostView';
import ReceiverView from './components/ReceiverView';
import QRCodeModal from './components/QRCodeModal';
import QRScannerModal from './components/QRScannerModal';
import MediaPreviewModal from './components/MediaPreviewModal';
import TransferProgressModal from './components/TransferProgressModal';
import ChatDrawer from './components/ChatDrawer';
import { Zap, Wifi, UploadCloud, DownloadCloud, ShieldCheck, Share2 } from 'lucide-react';

export default function App() {
  const {
    peerId,
    roomId,
    isHost,
    connectionStatus,
    errorMsg,
    connectedPeers,
    sharedFiles,
    remoteFiles,
    transfers,
    chatMessages,
    createRoom,
    joinRoom,
    addSharedFiles,
    removeSharedFile,
    requestFileDownload,
    sendChatMessage,
  } = useWebRTC();

  const [activeTab, setActiveTab] = useState('host'); // 'host' | 'join'
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Auto-connect if URL contains hash e.g. #room=FW-8A92
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('room=')) {
      const targetRoom = hash.split('room=')[1].split('&')[0];
      if (targetRoom) {
        setActiveTab('join');
        joinRoom(targetRoom);
      }
    } else {
      // Default to host mode and generate room ID
      createRoom();
    }
  }, []);

  // Trigger confetti when a transfer completes
  useEffect(() => {
    const hasCompleted = Object.values(transfers).some(
      (t) => t.status === 'completed' && !t.hasTriggeredConfetti
    );
    if (hasCompleted) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.8 },
      });
    }
  }, [transfers]);

  const handleScanSuccess = (scannedText) => {
    setShowScannerModal(false);
    let targetRoom = scannedText.trim();
    if (scannedText.includes('room=')) {
      targetRoom = scannedText.split('room=')[1].split('&')[0];
    }
    setActiveTab('join');
    joinRoom(targetRoom);
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === 'host' && !isHost) {
      createRoom();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      <div>
        {/* Navigation Header */}
        <Header
          roomId={roomId}
          isHost={isHost}
          connectionStatus={connectionStatus}
          connectedPeersCount={connectedPeers.length}
          onOpenQR={() => setShowQRModal(true)}
          onOpenChat={() => setShowChatDrawer(true)}
          unreadCount={chatMessages.filter((m) => !m.isMe).length}
        />

        {/* Main Workspace */}
        <main className="max-w-6xl mx-auto px-4 py-4 pb-20">
          {/* Tab Switcher */}
          <div className="flex justify-center mb-8">
            <div className="glass-panel p-1.5 inline-flex items-center gap-1 rounded-2xl border-slate-800">
              <button
                onClick={() => handleTabSwitch('host')}
                className={`py-2.5 px-6 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'host'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Host / Share Files</span>
              </button>
              <button
                onClick={() => handleTabSwitch('join')}
                className={`py-2.5 px-6 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'join'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Receive Files</span>
              </button>
            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === 'host' ? (
            <HostView
              roomId={roomId}
              connectionStatus={connectionStatus}
              connectedPeers={connectedPeers}
              sharedFiles={sharedFiles}
              transfers={transfers}
              onAddFiles={addSharedFiles}
              onRemoveFile={removeSharedFile}
              onOpenQR={() => setShowQRModal(true)}
              onPreviewFile={(f) => setPreviewFile(f)}
            />
          ) : (
            <ReceiverView
              connectionStatus={connectionStatus}
              errorMsg={errorMsg}
              remoteFiles={remoteFiles}
              transfers={transfers}
              onJoinRoom={joinRoom}
              onOpenScanner={() => setShowScannerModal(true)}
              onRequestDownload={requestFileDownload}
              onPreviewFile={(f) => setPreviewFile(f)}
            />
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      {showQRModal && (
        <QRCodeModal
          roomId={roomId}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {showScannerModal && (
        <QRScannerModal
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScannerModal(false)}
        />
      )}

      {previewFile && (
        <MediaPreviewModal
          file={previewFile}
          blobUrl={
            Object.values(transfers).find(
              (t) => (t.fileId === previewFile.id || t.fileName === previewFile.name) && t.url
            )?.url
          }
          onClose={() => setPreviewFile(null)}
          onDownload={requestFileDownload}
        />
      )}

      {showChatDrawer && (
        <ChatDrawer
          messages={chatMessages}
          onSendMessage={sendChatMessage}
          onClose={() => setShowChatDrawer(false)}
        />
      )}

      <TransferProgressModal transfers={transfers} />

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-300">FlashWarp P2P</span>
            <span>— Direct Local LAN File Transfer</span>
          </div>
          <span>Built for GitHub Pages • 100% Serverless & Private</span>
        </div>
      </footer>
    </div>
  );
}
