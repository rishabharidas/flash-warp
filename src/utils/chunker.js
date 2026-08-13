export const CHUNK_SIZE = 64 * 1024; // 64 KB chunks
export const HIGH_WATERMARK = 4 * 1024 * 1024; // 4 MB backpressure threshold

/**
 * Class to slice and stream a File object in binary ArrayBuffers over a WebRTC DataConnection
 */
export class FileSender {
  constructor(file, conn, transferId, onProgress, onComplete, onError) {
    this.file = file;
    this.conn = conn;
    this.transferId = transferId;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
    this.offset = 0;
    this.chunkIndex = 0;
    this.totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    this.cancelled = false;
    this.startTime = null;
  }

  start() {
    this.startTime = Date.now();
    // Send file metadata header first
    this.conn.send({
      type: 'FILE_START',
      transferId: this.transferId,
      fileName: this.file.name,
      fileSize: this.file.size,
      fileType: this.file.type || 'application/octet-stream',
      totalChunks: this.totalChunks,
      chunkSize: CHUNK_SIZE,
    });

    this.sendNextChunk();
  }

  cancel() {
    this.cancelled = true;
    if (this.conn && this.conn.open) {
      try {
        this.conn.send({
          type: 'FILE_CANCEL',
          transferId: this.transferId,
        });
      } catch (err) {
        // channel may already be closed
      }
    }
  }

  sendNextChunk() {
    if (this.cancelled) return;

    if (this.offset >= this.file.size) {
      // Finished sending all chunks
      this.conn.send({
        type: 'FILE_COMPLETE',
        transferId: this.transferId,
      });
      if (this.onComplete) {
        this.onComplete(this.transferId);
      }
      return;
    }

    // Check DataChannel backpressure
    const dc = this.conn.dataChannel;
    if (dc && dc.bufferedAmount > HIGH_WATERMARK) {
      // Wait until buffered amount drops before continuing
      const checkInterval = setInterval(() => {
        if (this.cancelled) {
          clearInterval(checkInterval);
          return;
        }
        if (dc.bufferedAmount <= HIGH_WATERMARK / 2) {
          clearInterval(checkInterval);
          this.sendNextChunk();
        }
      }, 50);
      return;
    }

    const slice = this.file.slice(this.offset, this.offset + CHUNK_SIZE);
    const reader = new FileReader();

    reader.onload = (e) => {
      if (this.cancelled) return;

      const buffer = e.target.result;
      
      // Send chunk header and raw array buffer
      this.conn.send({
        type: 'FILE_CHUNK',
        transferId: this.transferId,
        chunkIndex: this.chunkIndex,
        data: buffer,
      });

      this.offset += buffer.byteLength;
      this.chunkIndex++;

      const now = Date.now();
      const elapsed = (now - this.startTime) / 1000;
      const speed = elapsed > 0 ? this.offset / elapsed : 0;
      const progress = Math.min(100, (this.offset / this.file.size) * 100);

      if (this.onProgress) {
        this.onProgress({
          transferId: this.transferId,
          bytesTransferred: this.offset,
          totalBytes: this.file.size,
          progress,
          speed,
          eta: speed > 0 ? (this.file.size - this.offset) / speed : 0,
        });
      }

      // Schedule next chunk (setTimeout 0 allows UI thread event loop tick)
      setTimeout(() => this.sendNextChunk(), 0);
    };

    reader.onerror = (err) => {
      if (this.onError) this.onError(err);
    };

    reader.readAsArrayBuffer(slice);
  }
}

/**
 * Class to accumulate binary ArrayBuffer chunks into a complete file Blob
 */
export class FileReceiver {
  constructor(metadata, onProgress, onComplete) {
    this.metadata = metadata; // { transferId, fileName, fileSize, fileType, totalChunks }
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.chunks = new Array(metadata.totalChunks);
    this.receivedChunks = 0;
    this.receivedBytes = 0;
    this.cancelled = false;
    this.startTime = Date.now();
  }

  cancel() {
    this.cancelled = true;
    this.chunks = [];
  }

  addChunk(chunkIndex, arrayBuffer) {
    if (this.cancelled) return;

    if (!this.chunks[chunkIndex]) {
      this.chunks[chunkIndex] = arrayBuffer;
      this.receivedChunks++;
      this.receivedBytes += arrayBuffer.byteLength;

      const now = Date.now();
      const elapsed = (now - this.startTime) / 1000;
      const speed = elapsed > 0 ? this.receivedBytes / elapsed : 0;
      const progress = Math.min(100, (this.receivedBytes / this.metadata.fileSize) * 100);

      if (this.onProgress) {
        this.onProgress({
          transferId: this.metadata.transferId,
          bytesTransferred: this.receivedBytes,
          totalBytes: this.metadata.fileSize,
          progress,
          speed,
          eta: speed > 0 ? (this.metadata.fileSize - this.receivedBytes) / speed : 0,
        });
      }
    }

    if (this.receivedChunks === this.metadata.totalChunks && !this.cancelled) {
      this.finish();
    }
  }

  finish() {
    const blob = new Blob(this.chunks, { type: this.metadata.fileType });
    const url = URL.createObjectURL(blob);
    if (this.onComplete) {
      this.onComplete({
        ...this.metadata,
        blob,
        url,
      });
    }
  }
}
