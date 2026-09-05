import React, { useState } from 'react';
import {
  Users,
  X,
  UserPlus,
  Trash2,
  Search,
  MessageSquare,
  Sparkles,
  ExternalLink,
  AtSign,
  Check
} from 'lucide-react';
import { User, FriendProfile } from '../types';
import { UserAvatar } from './UserAvatar';
import { sounds } from '../utils/soundEffects';

interface FriendsModalProps {
  isOpen: boolean;
  friends: FriendProfile[];
  roomUsers: User[];
  currentRoomId: string;
  onClose: () => void;
  onRemoveFriend: (friendId: string) => void;
  onAddFriendByUsername: (username: string) => boolean;
  onSelectFriend: (friend: FriendProfile) => void;
  onInviteFriend?: (friend: FriendProfile) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  friends,
  roomUsers,
  currentRoomId,
  onClose,
  onRemoveFriend,
  onAddFriendByUsername,
  onSelectFriend,
  onInviteFriend
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [addStatus, setAddStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean) return;

    const success = onAddFriendByUsername(clean);
    if (success) {
      sounds.playSuccess();
      setAddStatus(`Added @${clean} to friends!`);
      setNewUsername('');
    } else {
      sounds.playError();
      setAddStatus(`Could not find @${clean} in active rooms.`);
    }
    setTimeout(() => setAddStatus(null), 3000);
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.username && f.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                Friends List
                <span className="text-xs bg-indigo-950 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-800/60">
                  {friends.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Hang out, invite, and keep track of your friends
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Add Friend by Username */}
        <form onSubmit={handleAddSubmit} className="mt-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <UserPlus size={13} className="text-indigo-400" />
            Add Friend by Username
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs">@</span>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="username..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={!newUsername.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl flex items-center gap-1 shadow transition-colors"
            >
              Add
            </button>
          </div>
          {addStatus && (
            <p className="text-[11px] text-indigo-300 mt-1.5 font-medium">
              {addStatus}
            </p>
          )}
        </form>

        {/* Search Friends Filter */}
        {friends.length > 3 && (
          <div className="relative mt-3">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search friends..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        )}

        {/* Friends List */}
        <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
              <Users size={32} className="mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-300">
                {searchTerm ? 'No friends matched your search' : 'No friends added yet'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Click on any user’s avatar or video in the live stage or chat to view their profile and add them as a friend!
              </p>
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const inRoom = roomUsers.some((u) => u.id === friend.id);

              return (
                <div
                  key={friend.id}
                  className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 flex items-center justify-between gap-3 transition-colors"
                >
                  <div
                    onClick={() => {
                      sounds.playClick();
                      onSelectFriend(friend);
                    }}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="relative">
                      <UserAvatar user={friend} size="md" showSpeakingPulse={inRoom} />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                          inRoom ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                        title={inRoom ? 'In this room right now' : 'Offline / In another room'}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-200 truncate">
                          {friend.name}
                        </span>
                        {inRoom && (
                          <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-medium px-1.5 py-0.2 rounded-full">
                            In Room
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        @{friend.username || 'user'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {onInviteFriend && !inRoom && (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onInviteFriend(friend);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-medium transition-colors"
                        title="Invite to this hangout room"
                      >
                        Invite
                      </button>
                    )}

                    <button
                      onClick={() => {
                        sounds.playClick();
                        onRemoveFriend(friend.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-950/50 text-slate-500 hover:text-red-400 transition-colors"
                      title="Remove from friends"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
