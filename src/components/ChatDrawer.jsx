import React, { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';

export default function ChatDrawer({ messages, onSendMessage, onClose }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400">
          <MessageSquare className="w-5 h-5" />
          <h3 className="text-sm font-bold text-slate-100">Local Peer Chat</h3>
        </div>
        <button onClick={onClose} className="btn-icon w-8 h-8 text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-slate-500 my-10">
            No chat messages yet. Send a message to connected devices!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs ${
                  msg.isMe
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold rounded-br-none'
                    : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          className="glass-input text-xs py-2 px-3 flex-1"
        />
        <button type="submit" className="btn-primary py-2 px-3 text-xs">
          <Send className="w-4 h-4 text-slate-950" />
        </button>
      </form>
    </div>
  );
}
