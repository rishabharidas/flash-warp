import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';
import { generateRoomId } from '../utils/formatters';
import { FileSender, FileReceiver } from '../utils/chunker';

export function useWebRTC() {
  const [peerId, setPeerId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle' | 'initializing' | 'waiting' | 'connecting' | 'connected' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [connectedPeers, setConnectedPeers] = useState([]);
  
  // Host files available for sharing: array of { id, file, name, size, type, addedAt }
  const [sharedFiles, setSharedFiles] = useState([]);
  
  // Remote files available (for receiver): array of { id, name, size, type }
  const [remoteFiles, setRemoteFiles] = useState([]);
  
  // Active file transfers: object keyed by transferId -> { id, fileName, fileSize, progress, speed, eta, status, isOutgoing, url, blob }
  const [transfers, setTransfers] = useState({});

  // Chat messages: array of { id, sender, text, timestamp }
  const [chatMessages, setChatMessages] = useState([]);

  // Text / Clipboard snippets: array of { id, text, timestamp, isMe }
  const [textItems, setTextItems] = useState([]);

  // Toast notifications: array of { id, text, type }
  const [toasts, setToasts] = useState([]);

  // Session Statistics
  const [totalBytesTransferred, setTotalBytesTransferred] = useState(0);

  const peerRef = useRef(null);
  const connectionsRef = useRef({}); // peerId -> DataConnection
  const lastSeenRef = useRef({}); // peerId -> timestamp
  const isHostRef = useRef(false);
  const activeSendersRef = useRef({}); // transferId -> FileSender instance
  const activeReceiversRef = useRef({}); // transferId -> FileReceiver instance

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  const addToast = useCallback((text, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Remove a disconnected peer and update status
   */
  const removePeer = useCallback((remoteId) => {
    if (connectionsRef.current[remoteId]) {
      try {
        connectionsRef.current[remoteId].close();
      } catch (e) {}
      delete connectionsRef.current[remoteId];
    }
    delete lastSeenRef.current[remoteId];

    const remainingPeers = Object.keys(connectionsRef.current);
    setConnectedPeers(remainingPeers);
    addToast('Peer device disconnected', 'warn');

    if (remainingPeers.length === 0) {
      setConnectionStatus(isHostRef.current ? 'waiting' : 'disconnected');
    }
  }, [addToast]);

  /**
   * Broadcast a JSON control message to all connected peers
   */
  const broadcast = useCallback((message) => {
    Object.values(connectionsRef.current).forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(message);
        } catch (e) {}
      }
    });
  }, []);

  /**
   * Setup connection handlers for a DataConnection
   */
  const setupConnection = useCallback((conn) => {
    const remoteId = conn.peer;
    connectionsRef.current[remoteId] = conn;
    lastSeenRef.current[remoteId] = Date.now();

    conn.on('open', () => {
      lastSeenRef.current[remoteId] = Date.now();
      setConnectedPeers(Object.keys(connectionsRef.current));
      setConnectionStatus('connected');
      setErrorMsg('');
      addToast('Device connected successfully', 'success');

      // Setup ICE connection state monitoring for rapid disconnect detection
      if (conn.peerConnection) {
        conn.peerConnection.oniceconnectionstatechange = () => {
          const iceState = conn.peerConnection?.iceConnectionState;
          if (iceState === 'disconnected' || iceState === 'failed' || iceState === 'closed') {
            removePeer(remoteId);
          }
        };
      }

      // If host, send inventory to newly connected peer
      setSharedFiles((currentFiles) => {
        const inventory = currentFiles.map((f) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
        }));
        try {
          conn.send({ type: 'INVENTORY_UPDATE', files: inventory });
        } catch (e) {}
        return currentFiles;
      });
    });

    conn.on('data', (data) => {
      if (!data || typeof data !== 'object') return;
      lastSeenRef.current[remoteId] = Date.now();

      switch (data.type) {
        case 'PING':
          try {
            conn.send({ type: 'PONG' });
          } catch (e) {}
          break;

        case 'PONG':
          lastSeenRef.current[remoteId] = Date.now();
          break;

        case 'PEER_DISCONNECT':
          removePeer(remoteId);
          break;

        case 'INVENTORY_UPDATE':
          setRemoteFiles(data.files || []);
          break;

        case 'TEXT_SHARE': {
          const item = {
            id: Date.now() + Math.random(),
            text: data.text,
            timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: false,
          };
          setTextItems((prev) => [item, ...prev]);
          addToast('Received text snippet', 'info');
          break;
        }

        case 'FILE_CANCEL': {
          const cancelId = data.transferId;
          if (activeSendersRef.current[cancelId]) {
            activeSendersRef.current[cancelId].cancel();
            delete activeSendersRef.current[cancelId];
          }
          if (activeReceiversRef.current[cancelId]) {
            activeReceiversRef.current[cancelId].cancel();
            delete activeReceiversRef.current[cancelId];
          }
          setTransfers((prev) => ({
            ...prev,
            [cancelId]: {
              ...prev[cancelId],
              status: 'cancelled',
            },
          }));
          addToast('Transfer stopped by peer', 'warn');
          break;
        }

        case 'REQUEST_FILE': {
          // Peer requested a file from host
          const fileId = data.fileId;
          setSharedFiles((currentFiles) => {
            const target = currentFiles.find((f) => f.id === fileId);
            if (target && target.file) {
              const transferId = `${fileId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
              
              // Register transfer state
              setTransfers((prev) => ({
                ...prev,
                [transferId]: {
                  id: transferId,
                  fileId,
                  fileName: target.name,
                  fileSize: target.size,
                  fileType: target.type,
                  progress: 0,
                  speed: 0,
                  eta: 0,
                  status: 'transferring',
                  isOutgoing: true,
                },
              }));

              const sender = new FileSender(
                target.file,
                conn,
                transferId,
                (progressData) => {
                  setTransfers((prev) => ({
                    ...prev,
                    [transferId]: {
                      ...prev[transferId],
                      ...progressData,
                    },
                  }));
                },
                (completedId) => {
                  setTransfers((prev) => ({
                    ...prev,
                    [completedId]: {
                      ...prev[completedId],
                      status: 'completed',
                      progress: 100,
                    },
                  }));
                  setTotalBytesTransferred((prev) => prev + target.size);
                  addToast(`Sent ${target.name}`, 'success');
                  delete activeSendersRef.current[completedId];
                },
                (err) => {
                  setTransfers((prev) => ({
                    ...prev,
                    [transferId]: {
                      ...prev[transferId],
                      status: 'error',
                      error: err?.message || 'Transfer failed',
                    },
                  }));
                }
              );

              activeSendersRef.current[transferId] = sender;
              sender.start();
            }
            return currentFiles;
          });
          break;
        }

        case 'FILE_START': {
          // Host started sending a file chunk stream
          const receiver = new FileReceiver(
            data,
            (progressData) => {
              setTransfers((prev) => ({
                ...prev,
                [data.transferId]: {
                  ...prev[data.transferId],
                  ...progressData,
                },
              }));
            },
            (completedFileData) => {
              setTransfers((prev) => ({
                ...prev,
                [data.transferId]: {
                  ...prev[data.transferId],
                  status: 'completed',
                  progress: 100,
                  url: completedFileData.url,
                  blob: completedFileData.blob,
                },
              }));
              setTotalBytesTransferred((prev) => prev + (data.fileSize || 0));
              addToast(`Downloaded ${data.fileName}`, 'success');
              delete activeReceiversRef.current[data.transferId];
            }
          );

          activeReceiversRef.current[data.transferId] = receiver;

          setTransfers((prev) => ({
            ...prev,
            [data.transferId]: {
              id: data.transferId,
              fileName: data.fileName,
              fileSize: data.fileSize,
              fileType: data.fileType,
              progress: 0,
              speed: 0,
              eta: 0,
              status: 'transferring',
              isOutgoing: false,
            },
          }));
          break;
        }

        case 'FILE_CHUNK': {
          const receiver = activeReceiversRef.current[data.transferId];
          if (receiver) {
            receiver.addChunk(data.chunkIndex, data.data);
          }
          break;
        }

        case 'FILE_COMPLETE': {
          break;
        }

        case 'CHAT_MESSAGE': {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              sender: remoteId.substring(0, 8),
              text: data.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: false,
            },
          ]);
          break;
        }

        default:
          break;
      }
    });

    conn.on('close', () => {
      removePeer(remoteId);
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      removePeer(remoteId);
    });
  }, [removePeer]);

  /**
   * Periodic Heartbeat ping-pong to clean up stale peer connections (e.g. phone closed browser tab)
   */
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      Object.keys(connectionsRef.current).forEach((remoteId) => {
        const conn = connectionsRef.current[remoteId];
        const lastSeen = lastSeenRef.current[remoteId] || 0;

        // If no response received for over 8 seconds, prune stale peer
        if (now - lastSeen > 8000) {
          removePeer(remoteId);
        } else if (conn && conn.open) {
          try {
            conn.send({ type: 'PING' });
          } catch (e) {
            removePeer(remoteId);
          }
        }
      });
    }, 3000);

    return () => clearInterval(heartbeatInterval);
  }, [removePeer]);

  /**
   * Window unload / pagehide notification for clean peer disconnect
   */
  useEffect(() => {
    const handleUnload = () => {
      Object.values(connectionsRef.current).forEach((conn) => {
        if (conn && conn.open) {
          try {
            conn.send({ type: 'PEER_DISCONNECT' });
            conn.close();
          } catch (e) {}
        }
      });
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

  /**
   * Create a new host session with a unique Room ID
   */
  const createRoom = useCallback((customId) => {
    const id = (customId || generateRoomId()).toUpperCase();
    setRoomId(id);
    setIsHost(true);
    setConnectionStatus('initializing');
    setErrorMsg('');

    if (peerRef.current) {
      peerRef.current.destroy();
    }

    const peer = new Peer(id, { debug: 1 });
    peerRef.current = peer;

    peer.on('open', (assignedId) => {
      setPeerId(assignedId);
      setConnectionStatus('waiting');
    });

    peer.on('connection', (conn) => {
      setupConnection(conn);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'unavailable-id') {
        setErrorMsg('Room ID is already taken. Generating a new ID...');
        setTimeout(() => createRoom(), 1000);
      } else {
        setErrorMsg(`Room error: ${err.type || 'Connection failed'}`);
        setConnectionStatus('error');
      }
    });
  }, [setupConnection]);

  /**
   * Join an existing room via Room ID
   */
  const joinRoom = useCallback((targetRoomId) => {
    const cleanRoomId = targetRoomId.trim().toUpperCase();
    if (!cleanRoomId) {
      setErrorMsg('Please enter a valid Room ID');
      return;
    }

    setRoomId(cleanRoomId);
    setIsHost(false);
    setConnectionStatus('connecting');
    setErrorMsg('');

    if (peerRef.current) {
      peerRef.current.destroy();
    }

    const peer = new Peer({ debug: 1 });
    peerRef.current = peer;

    peer.on('open', (myPeerId) => {
      setPeerId(myPeerId);
      const conn = peer.connect(cleanRoomId, { reliable: true });
      setupConnection(conn);
    });

    peer.on('error', (err) => {
      console.error('Join error:', err);
      setErrorMsg(`Failed to connect to room ${cleanRoomId}. Check code & network.`);
      setConnectionStatus('error');
    });
  }, [setupConnection]);

  /**
   * Add files to host shared list & broadcast update
   */
  const addSharedFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList).map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      file: f,
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      addedAt: Date.now(),
    }));

    setSharedFiles((prev) => {
      const updated = [...prev, ...newFiles];
      const inventory = updated.map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        type: item.type,
      }));
      broadcast({ type: 'INVENTORY_UPDATE', files: inventory });
      return updated;
    });
  }, [broadcast]);

  /**
   * Remove a file from host list
   */
  const removeSharedFile = useCallback((fileId) => {
    setSharedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      const inventory = updated.map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        type: item.type,
      }));
      broadcast({ type: 'INVENTORY_UPDATE', files: inventory });
      return updated;
    });
  }, [broadcast]);

  /**
   * Request a remote file download
   */
  const requestFileDownload = useCallback((fileId) => {
    broadcast({ type: 'REQUEST_FILE', fileId });
  }, [broadcast]);

  /**
   * Cancel an active file transfer
   */
  const cancelTransfer = useCallback((transferId) => {
    if (activeSendersRef.current[transferId]) {
      activeSendersRef.current[transferId].cancel();
      delete activeSendersRef.current[transferId];
    }
    if (activeReceiversRef.current[transferId]) {
      activeReceiversRef.current[transferId].cancel();
      delete activeReceiversRef.current[transferId];
    }
    broadcast({ type: 'FILE_CANCEL', transferId });
    setTransfers((prev) => ({
      ...prev,
      [transferId]: {
        ...prev[transferId],
        status: 'cancelled',
      },
    }));
  }, [broadcast]);

  /**
   * Send text chat message
   */
  const sendChatMessage = useCallback((text) => {
    if (!text.trim()) return;
    const msg = {
      id: Date.now(),
      sender: 'Me',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setChatMessages((prev) => [...prev, msg]);
    broadcast({ type: 'CHAT_MESSAGE', text: text.trim() });
  }, [broadcast]);

  /**
   * Send text / clipboard snippet
   */
  const sendTextSnippet = useCallback((text) => {
    if (!text.trim()) return;
    const item = {
      id: Date.now() + Math.random(),
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setTextItems((prev) => [item, ...prev]);
    broadcast({ type: 'TEXT_SHARE', text: text.trim(), timestamp: item.timestamp });
    addToast('Text snippet shared', 'success');
  }, [broadcast, addToast]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  return {
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
  };
}
