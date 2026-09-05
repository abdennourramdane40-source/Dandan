import React, { useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Crown,
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { User, FloatingReaction } from '../types';
import { UserAvatar } from './UserAvatar';

interface LiveStageProps {
  users: User[];
  currentUser: User | null;
  localStream: MediaStream | null;
  isCamOn: boolean;
  isMicOn: boolean;
  floatingReactions: FloatingReaction[];
  onToggleCam: () => void;
  onToggleMic: () => void;
  onSendReaction: (emoji: string) => void;
  onViewProfile?: (user: User) => void;
}

export const LiveStage: React.FC<LiveStageProps> = ({
  users,
  currentUser,
  localStream,
  isCamOn,
  isMicOn,
  floatingReactions,
  onToggleCam,
  onToggleMic,
  onSendReaction,
  onViewProfile
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local video stream when camera is on
  useEffect(() => {
    if (localVideoRef.current && localStream && isCamOn) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCamOn]);

  const quickEmojis = ['🔥', '❤️', '😂', '🎉', '🚀', '👏'];

  return (
    <div className="relative flex flex-col bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Floating emoji overlay */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingReactions.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-16 floating-emoji text-3xl select-none flex flex-col items-center"
            style={{ left: `${item.x}%` }}
          >
            <span>{item.emoji}</span>
            <span className="text-[10px] text-slate-300 font-semibold bg-slate-900/80 px-1.5 py-0.5 rounded-full mt-0.5 border border-slate-700/50">
              {item.senderName}
            </span>
          </div>
        ))}
      </div>

      {/* Top stage header */}
      <div className="px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/70">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Live Stage & Audio Lounge
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            ({users.length} {users.length === 1 ? 'person' : 'people'} hanging out)
          </span>
        </div>
      </div>

      {/* Video & Avatar Stage Grid */}
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 auto-rows-fr min-h-[140px] max-h-[260px] overflow-y-auto">
        {users.map((user) => {
          const isMe = user.id === currentUser?.id;
          const userCamActive = isMe ? isCamOn : user.isCamOn;
          const userMicActive = isMe ? isMicOn : user.isMicOn;

          return (
            <div
              key={user.id}
              onClick={() => onViewProfile && onViewProfile(user)}
              title={`Click to view ${user.name}'s profile`}
              className={`relative rounded-xl overflow-hidden aspect-video bg-gradient-to-b from-slate-900 to-slate-950 border transition-all duration-300 flex flex-col items-center justify-center group cursor-pointer ${
                user.isSpeaking
                  ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                  : 'border-slate-800/80 hover:border-indigo-500/50 hover:shadow-md'
              }`}
            >
              {/* Background ambient radial glow */}
              <div
                className="absolute inset-0 opacity-15 blur-xl pointer-events-none"
                style={{ backgroundColor: user.avatarColor }}
              />

              {/* Video Element if camera is on */}
              {isMe && userCamActive ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                /* Virtual Avatar Tile */
                <div className="relative z-10 flex flex-col items-center justify-center p-2">
                  <UserAvatar
                    user={user}
                    size="lg"
                    showSpeakingPulse={true}
                    showCrown={true}
                  />

                  {/* Sound Wave bars when speaking */}
                  {user.isSpeaking && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                      <span
                        className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.15s' }}
                      />
                      <span
                        className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.3s' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Participant Name & Badges Overlay */}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-800/80 max-w-[80%]">
                  <span className="text-[11px] font-medium text-slate-200 truncate">
                    {user.name} {isMe ? '(You)' : ''}
                  </span>
                  {user.isHost && (
                    <Crown size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                  )}
                </div>

                {/* Mic Status icon */}
                <div
                  className={`p-1 rounded-md text-[10px] flex items-center justify-center border ${
                    userMicActive
                      ? 'bg-slate-900/90 text-emerald-400 border-emerald-900/60'
                      : 'bg-red-950/80 text-red-400 border-red-900/60'
                  }`}
                  title={userMicActive ? 'Microphone is on' : 'Microphone is muted'}
                >
                  {userMicActive ? <Mic size={11} /> : <MicOff size={11} />}
                </div>
              </div>

              {/* Score pill if participant scored in games */}
              {(user.score || 0) > 0 && (
                <div className="absolute top-1.5 right-1.5 z-20 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Sparkles size={9} />
                  <span>{user.score} pts</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stage Bottom Controls Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Media Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isMicOn
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/30'
                : 'bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800/50'
            }`}
            title={isMicOn ? 'Mute Microphone' : 'Turn On Microphone'}
          >
            {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
            <span>{isMicOn ? 'Mic On' : 'Unmute'}</span>
          </button>

          <button
            onClick={onToggleCam}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isCamOn
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-700/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
            }`}
            title={isCamOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isCamOn ? <Video size={14} /> : <VideoOff size={14} />}
            <span>{isCamOn ? 'Cam On' : 'Start Cam'}</span>
          </button>
        </div>

        {/* Right: Instant Floating Reaction Emojis */}
        <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800/80 px-2 py-1 rounded-xl">
          <span className="text-[10px] text-slate-400 font-medium px-1 hidden sm:inline">
            React:
          </span>
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="w-7 h-7 flex items-center justify-center hover:scale-125 transition-transform active:scale-95 text-base rounded-md hover:bg-slate-800/80"
              title={`Send ${emoji} reaction`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
