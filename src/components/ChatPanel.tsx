import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Trophy,
  Sparkles,
  Flame,
  MessageSquare,
  Volume2
} from 'lucide-react';
import { ChatMessage, User } from '../types';
import { UserAvatar } from './UserAvatar';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUser: User | null;
  onSendMessage: (text: string) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  activeGameType?: string | null;
  onViewSenderProfile?: (senderId: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUser,
  onSendMessage,
  onReactMessage,
  activeGameType,
  onViewSenderProfile
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const quickReactions = ['❤️', '🔥', '😂', '🎉', '👍', '👏'];

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-indigo-400" />
          <h3 className="font-display font-semibold text-sm text-slate-200">
            Room Chat & Live Guesses
          </h3>
        </div>
        {activeGameType && (
          <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles size={10} />
            Game Guesses Live
          </span>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 min-h-0 text-sm">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          const isSystem = msg.type === 'system';
          const isCorrectGuess = msg.type === 'correct_guess';

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="py-1 px-3 text-center rounded-lg bg-slate-800/40 border border-slate-700/30 text-xs text-slate-400 my-1 font-medium"
              >
                {msg.text}
              </div>
            );
          }

          if (isCorrectGuess) {
            return (
              <div
                key={msg.id}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-950/70 via-amber-900/40 to-amber-950/70 border border-amber-500/50 shadow-md text-amber-200 text-xs flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-full bg-amber-500/30 flex items-center justify-center text-amber-300 flex-shrink-0">
                  <Trophy size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-amber-300 mr-1.5">
                    {msg.senderName}:
                  </span>
                  <span>{msg.text}</span>
                </div>
                <span className="text-[10px] text-amber-400/70 flex-shrink-0">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`group flex items-start gap-2.5 ${
                isMe ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Sender Avatar */}
              <button
                type="button"
                onClick={() => onViewSenderProfile && onViewSenderProfile(msg.senderId)}
                title={`View ${msg.senderName}'s profile`}
                className="hover:opacity-80 transition-opacity"
              >
                <UserAvatar
                  user={{
                    avatarColor: msg.avatarColor,
                    name: msg.senderName
                  }}
                  size="sm"
                  showSpeakingPulse={false}
                />
              </button>

              <div
                className={`max-w-[78%] flex flex-col ${
                  isMe ? 'items-end' : 'items-start'
                }`}
              >
                {/* Sender Name & Time */}
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <button
                    type="button"
                    onClick={() => onViewSenderProfile && onViewSenderProfile(msg.senderId)}
                    className="text-[11px] font-semibold text-slate-300 hover:text-indigo-400 transition-colors"
                  >
                    {isMe ? 'You' : msg.senderName}
                  </button>
                  <span className="text-[10px] text-slate-500">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`py-2 px-3 rounded-2xl break-words text-sm relative ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Reaction list */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 -mb-0.5">
                      {Object.entries(msg.reactions).map(([emoji, rawIds]) => {
                        const userIds = (rawIds as string[]) || [];
                        if (userIds.length === 0) return null;
                        return (
                          <button
                            key={emoji}
                            onClick={() => onReactMessage(msg.id, emoji)}
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border transition-colors ${
                              currentUser && userIds.includes(currentUser.id)
                                ? 'bg-indigo-500/30 border-indigo-400/60 text-white'
                                : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick hover reaction launcher */}
                  <div
                    className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-slate-900 border border-slate-700 rounded-full px-1.5 py-0.5 shadow-lg ${
                      isMe ? 'right-full mr-1.5' : 'left-full ml-1.5'
                    }`}
                  >
                    {['❤️', '🔥', '👍'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onReactMessage(msg.id, emoji)}
                        className="hover:scale-125 transition-transform p-0.5 text-xs"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Bar drawer */}
      {showEmojiPicker && (
        <div className="px-3 py-1.5 bg-slate-850 border-t border-slate-800 flex items-center gap-1.5">
          {quickReactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputText((prev) => prev + emoji);
              }}
              className="p-1 hover:bg-slate-700 rounded-md text-base hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="p-2.5 border-t border-slate-800/80 bg-slate-900/95 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ${
            showEmojiPicker ? 'text-indigo-400 bg-slate-800' : ''
          }`}
          title="Insert emoji"
        >
          <Smile size={18} />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            activeGameType === 'draw_and_guess'
              ? 'Guess the drawing or chat...'
              : activeGameType === 'word_scramble'
              ? 'Unscramble the word or chat...'
              : 'Type a message to the room...'
          }
          className="flex-1 bg-slate-800/90 border border-slate-700/70 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/20"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
