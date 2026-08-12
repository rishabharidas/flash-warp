import React, { useState } from 'react';

export default function ChatDrawer({ messages, onSendMessage, onClose }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#141417] border-l border-[#27272a] shadow-2xl flex flex-col">
      {/* Header (No icons!) */}
      <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Peer Chat</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white text-xs font-mono">
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 my-10">
            No chat messages yet.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                  msg.isMe
                    ? 'bg-white text-black font-semibold rounded-br-none'
                    : 'bg-[#1c1c20] text-zinc-200 border border-[#27272a] rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#27272a] flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          className="mono-input text-xs py-2 px-3 flex-1"
        />
        <button type="submit" className="btn-mono-white py-2 px-3 text-xs">
          Send
        </button>
      </form>
    </div>
  );
}
