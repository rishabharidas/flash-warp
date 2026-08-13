import React, { useState } from 'react';
import { Copy, Check, Send, X, FileText } from 'lucide-react';

export default function TextShareModal({ textItems, onSendText, onClose, onCopySuccess }) {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendText(inputText);
    setInputText('');
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onCopySuccess) onCopySuccess();
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card relative max-w-md w-full p-4 sm:p-5 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-300" />
            <h3 className="text-sm font-bold text-white">Instant Clipboard & Text Share</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xs font-mono">
            ✕
          </button>
        </div>

        {/* Text Items List */}
        <div className="flex-1 overflow-y-auto my-3 space-y-2.5 custom-scroll pr-1 min-h-[160px] max-h-[350px]">
          {textItems.length === 0 ? (
            <div className="text-center text-xs text-zinc-500 py-10">
              No shared text snippets yet. Paste links, passwords, or notes below to transfer instantly.
            </div>
          ) : (
            textItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-[#1c1c20] border border-[#27272a] space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-zinc-200 font-mono select-all break-all whitespace-pre-wrap flex-1">
                    {item.text}
                  </p>
                  <button
                    onClick={() => handleCopy(item.id, item.text)}
                    className="btn-mono text-[11px] py-1 px-2 flex-shrink-0 flex items-center gap-1"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pt-1 border-t border-[#27272a]/60">
                  <span>{item.isMe ? 'Sent by you' : 'Shared by peer'}</span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="pt-2 border-t border-[#27272a] flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste text, Wi-Fi password, or URL to share..."
            className="mono-input text-xs flex-1"
          />
          <button type="submit" className="btn-mono-white text-xs py-1.5 px-3 flex items-center gap-1">
            <Send className="w-3 h-3" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
