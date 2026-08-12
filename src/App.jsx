import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useWebRTC } from './hooks/useWebRTC';
import MinimalTransferCard from './components/MinimalTransferCard';
import QRCodeModal from './components/QRCodeModal';
import MediaPreviewModal from './components/MediaPreviewModal';
import ChatDrawer from './components/ChatDrawer';

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

  const [showQRModal, setShowQRModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Auto-connect if URL contains hash e.g. #room=FW-8A92
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('room=')) {
      const targetRoom = hash.split('room=')[1].split('&')[0];
      if (targetRoom) {
        joinRoom(targetRoom);
      }
    } else {
      createRoom();
    }
  }, []);

  // Trigger celebratory confetti on completed file download
  useEffect(() => {
    const hasCompleted = Object.values(transfers).some(
      (t) => t.status === 'completed' && !t.hasTriggeredConfetti
    );
    if (hasCompleted) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
      });
    }
  }, [transfers]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] p-4">
      {/* Centered Minimal Transfer Card */}
      <MinimalTransferCard
        roomId={roomId}
        isHost={isHost}
        connectionStatus={connectionStatus}
        connectedPeers={connectedPeers}
        sharedFiles={sharedFiles}
        remoteFiles={remoteFiles}
        transfers={transfers}
        onAddFiles={addSharedFiles}
        onRemoveFile={removeSharedFile}
        onOpenQR={() => setShowQRModal(true)}
        onOpenChat={() => setShowChatDrawer(true)}
        onRequestDownload={requestFileDownload}
        onPreviewFile={(f) => setPreviewFile(f)}
        onJoinRoom={joinRoom}
        chatUnreadCount={chatMessages.filter((m) => !m.isMe).length}
      />

      {/* Modals & Overlays */}
      {showQRModal && (
        <QRCodeModal
          roomId={roomId}
          onClose={() => setShowQRModal(false)}
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
    </div>
  );
}
