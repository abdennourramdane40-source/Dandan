import React, { useState, useEffect } from 'react';
import {
  DoorOpen,
  X,
  Users,
  Plus,
  Lock,
  KeyRound,
  Shield,
  Check
} from 'lucide-react';
import { RoomInfo } from '../types';
import { sounds } from '../utils/soundEffects';

interface RoomModalProps {
  isOpen: boolean;
  currentRoomId: string;
  onClose: () => void;
  onJoinRoom: (roomId: string, roomName?: string, passcode?: string) => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  currentRoomId,
  onClose,
  onJoinRoom
}) => {
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [customRoomPasscode, setCustomRoomPasscode] = useState('');
  const [requirePasscode, setRequirePasscode] = useState(false);

  // For joining a locked room
  const [selectedLockedRoom, setSelectedLockedRoom] = useState<RoomInfo | null>(null);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const [publicRooms, setPublicRooms] = useState<RoomInfo[]>([
    { roomId: 'lounge-1', roomName: 'Chill Lounge & Chat', userCount: 1 },
    { roomId: 'party-1', roomName: 'Party Games Arena', userCount: 1 },
    { roomId: 'trivia-1', roomName: 'Trivia & Brainteasers', userCount: 1 }
  ]);

  // Fetch active public rooms from backend
  useEffect(() => {
    if (isOpen) {
      fetch('/api/rooms')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setPublicRooms(data);
        })
        .catch((err) => console.warn('Could not fetch rooms list:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJoinClick = (room: RoomInfo) => {
    if (room.hasPassword) {
      setSelectedLockedRoom(room);
      setEnteredPasscode('');
      setPasscodeError(null);
      sounds.playClick();
    } else {
      sounds.playJoin();
      onJoinRoom(room.roomId, room.roomName);
      onClose();
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLockedRoom) return;
    if (!enteredPasscode.trim()) {
      setPasscodeError('Please enter the room passcode.');
      sounds.playError();
      return;
    }
    sounds.playJoin();
    onJoinRoom(selectedLockedRoom.roomId, selectedLockedRoom.roomName, enteredPasscode.trim());
    setSelectedLockedRoom(null);
    onClose();
  };

  const handleJoinCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customRoomCode.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!clean) return;

    sounds.playJoin();
    onJoinRoom(
      clean,
      `Room #${clean.toUpperCase()}`,
      requirePasscode && customRoomPasscode.trim() ? customRoomPasscode.trim() : undefined
    );
    setCustomRoomCode('');
    setCustomRoomPasscode('');
    setRequirePasscode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <DoorOpen size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-100">
                Hangout Lounges
              </h3>
              <p className="text-xs text-slate-400">
                Switch rooms or create private party rooms
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

        {/* Locked Room Passcode Prompt Modal */}
        {selectedLockedRoom ? (
          <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-indigo-500/40">
            <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold text-sm">
              <Lock size={16} />
              <span>Password Required for {selectedLockedRoom.roomName}</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              This hangout lounge is protected by a private passcode.
            </p>

            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  autoFocus
                  value={enteredPasscode}
                  onChange={(e) => setEnteredPasscode(e.target.value)}
                  placeholder="Enter room passcode..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {passcodeError && (
                <p className="text-xs text-red-400 font-medium">{passcodeError}</p>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedLockedRoom(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Enter Room</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Lounges List */}
            <div className="mt-4 mb-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Active Hangout Rooms
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {publicRooms.map((r) => {
                  const isCurrent = r.roomId === currentRoomId;
                  return (
                    <div
                      key={r.roomId}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-indigo-950/40 border-indigo-500/50'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-200 truncate">
                            {r.roomName}
                          </span>
                          {r.hasPassword && (
                            <span
                              title="Password Protected"
                              className="p-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            >
                              <Lock size={11} />
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Users size={12} />
                          {r.userCount} {r.userCount === 1 ? 'user' : 'users'} in room
                        </span>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => handleJoinClick(r)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow transition-all flex items-center gap-1.5 ${
                            r.hasPassword
                              ? 'bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {r.hasPassword && <Lock size={12} />}
                          <span>Join</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom / Private Room Creation */}
            <form onSubmit={handleJoinCustom} className="pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Create or Join Custom Room
              </span>

              <div className="space-y-2.5">
                <input
                  type="text"
                  value={customRoomCode}
                  onChange={(e) => setCustomRoomCode(e.target.value)}
                  placeholder="Room name or code (e.g. friday-night)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />

                {/* Password Protection Toggle */}
                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={requirePasscode}
                      onChange={(e) => setRequirePasscode(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex items-center gap-1">
                      <Shield size={13} className="text-indigo-400" />
                      Make Room Private (Require Passcode)
                    </span>
                  </label>
                </div>

                {requirePasscode && (
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      value={customRoomPasscode}
                      onChange={(e) => setCustomRoomPasscode(e.target.value)}
                      placeholder="Enter room password / PIN"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!customRoomCode.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <Plus size={15} />
                  <span>Enter Room</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
