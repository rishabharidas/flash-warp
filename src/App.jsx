import React, { useState, useEffect } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import MinimalTransferCard from './components/MinimalTransferCard';
import QRCodeModal from './components/QRCodeModal';
import MediaPreviewModal from './components/MediaPreviewModal';
import ChatDrawer from './components/ChatDrawer';
import TextShareModal from './components/TextShareModal';
import ToastNotification from './components/ToastNotification';

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
    textItems,
    toasts,
    totalBytesTransferred,
    addToast,
    removeToast,
    createRoom,
    joinRoom,
    addSharedFiles,
    removeSharedFile,
    requestFileDownload,
    cancelTransfer,
    sendChatMessage,
    sendTextSnippet,
  } = useWebRTC();

  const [showQRModal, setShowQRModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showTextShareModal, setShowTextShareModal] = useState(false);
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
        totalBytesTransferred={totalBytesTransferred}
        onAddFiles={addSharedFiles}
        onRemoveFile={removeSharedFile}
        onOpenQR={() => setShowQRModal(true)}
        onOpenChat={() => setShowChatDrawer(true)}
        onOpenTextShare={() => setShowTextShareModal(true)}
        onRequestDownload={requestFileDownload}
        onCancelTransfer={cancelTransfer}
        onPreviewFile={(f) => setPreviewFile(f)}
        onJoinRoom={joinRoom}
        chatUnreadCount={chatMessages.filter((m) => !m.isMe).length}
        textShareCount={textItems.length}
      />

      {/* Modals & Overlays */}
      {showQRModal && (
        <QRCodeModal
          roomId={roomId}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {showTextShareModal && (
        <TextShareModal
          textItems={textItems}
          onSendText={sendTextSnippet}
          onClose={() => setShowTextShareModal(false)}
          onCopySuccess={() => addToast('Copied to clipboard!', 'success')}
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

      {/* Non-intrusive Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
