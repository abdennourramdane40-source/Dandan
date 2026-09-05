import React from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  MessageSquare,
  Trophy,
  Crown,
  Sparkles,
  Mic,
  MicOff,
  Video,
  VideoOff,
  AtSign
} from 'lucide-react';
import { User } from '../types';
import { UserAvatar } from './UserAvatar';
import { sounds } from '../utils/soundEffects';

interface UserProfileCardModalProps {
  user: User | null;
  isOpen: boolean;
  isSelf: boolean;
  isFriend: boolean;
  onClose: () => void;
  onToggleFriend: (user: User) => void;
  onMentionUser?: (username: string) => void;
  onEditSelfProfile?: () => void;
}

export const UserProfileCardModal: React.FC<UserProfileCardModalProps> = ({
  user,
  isOpen,
  isSelf,
  isFriend,
  onClose,
  onToggleFriend,
  onMentionUser,
  onEditSelfProfile
}) => {
  if (!isOpen || !user) return null;

  const handleFriendClick = () => {
    sounds.playSuccess();
    onToggleFriend(user);
  };

  const handleMention = () => {
    sounds.playClick();
    if (onMentionUser) {
      onMentionUser(user.username || user.name);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-16 -left-16 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: user.avatarColor || '#6366f1' }}
        />

        {/* Close Button */}
        <div className="flex justify-end relative z-10">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card Content */}
        <div className="flex flex-col items-center text-center relative z-10 -mt-2">
          {/* Avatar */}
          <div className="relative mb-3">
            <UserAvatar
              user={user}
              size="2xl"
              showSpeakingPulse={true}
              showCrown={true}
            />
            {user.isSpeaking && (
              <span className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-900 shadow">
                Speaking
              </span>
            )}
          </div>

          {/* Name & Handle */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-display font-bold text-lg text-slate-100">
              {user.name}
            </h3>
            {user.isHost && (
              <span
                title="Room Host"
                className="bg-amber-400/20 text-amber-300 border border-amber-400/40 p-0.5 rounded-md"
              >
                <Crown size={13} />
              </span>
            )}
          </div>

          <span className="text-xs text-indigo-400 font-mono flex items-center gap-0.5 mb-3">
            <AtSign size={12} />
            {user.username || user.name.toLowerCase().replace(/\s+/g, '_')}
          </span>

          {/* Bio */}
          <div className="w-full bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 mb-4 text-xs text-slate-300 leading-relaxed text-left">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
              About
            </span>
            <p className="line-clamp-4">
              {user.bio || 'This hangout member has not added a bio yet.'}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-2 w-full mb-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Trophy size={16} />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-medium">Score</div>
                <div className="font-bold text-slate-100 text-sm font-mono">
                  {user.score || 0} pts
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles size={16} />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-medium">Status</div>
                <div className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  In Lounge
                </div>
              </div>
            </div>
          </div>

          {/* Live Device Status */}
          <div className="flex items-center justify-center gap-3 text-xs text-slate-400 mb-5">
            <span className="flex items-center gap-1">
              {user.isCamOn ? (
                <Video size={13} className="text-emerald-400" />
              ) : (
                <VideoOff size={13} className="text-slate-500" />
              )}
              {user.isCamOn ? 'Camera On' : 'Camera Off'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {user.isMicOn ? (
                <Mic size={13} className="text-emerald-400" />
              ) : (
                <MicOff size={13} className="text-slate-500" />
              )}
              {user.isMicOn ? 'Mic Live' : 'Muted'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-2">
            {isSelf ? (
              <button
                onClick={() => {
                  onClose();
                  if (onEditSelfProfile) onEditSelfProfile();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md"
              >
                Edit My Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleFriendClick}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    isFriend
                      ? 'bg-emerald-950/80 hover:bg-red-950/80 text-emerald-300 hover:text-red-300 border border-emerald-700/60 hover:border-red-700/60'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  {isFriend ? (
                    <>
                      <UserCheck size={14} />
                      <span>Friends</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Add Friend</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleMention}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/60"
                  title="Mention in room chat"
                >
                  <MessageSquare size={14} />
                  <span>Chat</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
