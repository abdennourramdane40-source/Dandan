import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  DoorOpen,
  Sparkles,
  Settings,
  Radio,
  Gamepad2,
  Volume2,
  VolumeX,
  Heart,
  Lock
} from 'lucide-react';
import { User, RoomState } from '../types';
import { UserAvatar } from './UserAvatar';
import { sounds } from '../utils/soundEffects';

interface NavbarProps {
  roomState: RoomState;
  currentUser: User | null;
  isConnected: boolean;
  friendCount?: number;
  isMuted?: boolean;
  onToggleSound?: () => void;
  onOpenRoomModal: () => void;
  onOpenProfileModal: () => void;
  onOpenFriendsModal?: () => void;
  onOpenGameSelector?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomState,
  currentUser,
  isConnected,
  friendCount = 0,
  isMuted = false,
  onToggleSound,
  onOpenRoomModal,
  onOpenProfileModal,
  onOpenFriendsModal,
  onOpenGameSelector
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    sounds.playClick();
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomState.roomId);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800/80 px-3 sm:px-5 flex items-center justify-between backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Left: Brand & Room Tag */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Radio size={19} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm sm:text-base text-slate-100 tracking-tight">
                Live Hangout
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Room badge */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1 text-xs">
          {roomState.hasPassword && (
            <Lock size={12} className="text-amber-400" title="Password protected room" />
          )}
          <span className="text-slate-300 font-medium max-w-[140px] truncate">
            {roomState.roomName}
          </span>
          <button
            onClick={handleCopyLink}
            title="Copy invite link with room code"
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 pl-1.5 border-l border-slate-700"
          >
            {copied ? (
              <Check size={13} className="text-emerald-400" />
            ) : (
              <Copy size={13} />
            )}
            <span className="text-[11px]">{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Right: Actions, Friends, Sound & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Sound Toggle */}
        {onToggleSound && (
          <button
            onClick={() => {
              sounds.playClick();
              onToggleSound();
            }}
            title={isMuted ? 'Unmute game audio effects' : 'Mute game audio effects'}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300'
                : 'bg-indigo-950/40 border-indigo-700/50 text-indigo-300 hover:text-indigo-200'
            }`}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        )}

        {/* Friends Button with Badge */}
        {onOpenFriendsModal && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenFriendsModal();
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/70 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
            title="Open friends list"
          >
            <Heart size={14} className="text-pink-400" />
            <span className="hidden md:inline">Friends</span>
            {friendCount > 0 && (
              <span className="text-[10px] font-bold bg-pink-950 text-pink-300 px-1.5 py-0.2 rounded-full border border-pink-800/60">
                {friendCount}
              </span>
            )}
          </button>
        )}

        {/* Party Games Selector */}
        {onOpenGameSelector && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenGameSelector();
            }}
            className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          >
            <Gamepad2 size={15} />
            <span className="hidden sm:inline">
              {roomState.activeGame ? 'Switch Game' : 'Party Games'}
            </span>
          </button>
        )}

        {/* Room Switcher */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenRoomModal();
          }}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 px-2.5 py-1.5 rounded-xl text-xs transition-colors"
          title="Switch room or create custom room"
        >
          <DoorOpen size={14} className="text-slate-400" />
          <span className="hidden lg:inline">Rooms</span>
        </button>

        {/* Current user profile pill */}
        {currentUser && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenProfileModal();
            }}
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 pl-1 pr-2.5 py-1 rounded-full text-xs transition-all text-slate-200"
            title="Edit your profile (name, picture, bio)"
          >
            <UserAvatar user={currentUser} size="xs" showSpeakingPulse={true} />
            <span className="font-semibold max-w-[80px] sm:max-w-[110px] truncate">
              {currentUser.name}
            </span>
            <Settings size={12} className="text-slate-400" />
          </button>
        )}

        {/* Connection status indicator */}
        <div
          title={isConnected ? 'Connected to live hangout' : 'Reconnecting to server...'}
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 animate-ping'
          }`}
        />
      </div>
    </header>
  );
};
