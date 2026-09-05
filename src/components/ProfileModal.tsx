import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  X,
  Upload,
  Trash2,
  AtSign,
  FileText,
  Palette,
  Sparkles,
  Camera,
  Check
} from 'lucide-react';
import { User } from '../types';
import { UserAvatar } from './UserAvatar';
import { AVATAR_COLORS, AVATAR_ICONS } from '../utils/mediaUtils';
import { sounds } from '../utils/soundEffects';

interface ProfileModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onSaveProfile: (profile: {
    name: string;
    username: string;
    avatarColor: string;
    avatarIcon: string;
    avatarUrl?: string;
    bio?: string;
  }) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaveProfile
}) => {
  const [name, setName] = useState(currentUser?.name || 'Hangout Guest');
  const [username, setUsername] = useState(
    currentUser?.username ||
      currentUser?.name.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
      'player'
  );
  const [bio, setBio] = useState(
    currentUser?.bio || 'Hey there! I am hanging out playing party games.'
  );
  const [color, setColor] = useState(currentUser?.avatarColor || AVATAR_COLORS[0]);
  const [icon, setIcon] = useState(currentUser?.avatarIcon || 'smile');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    currentUser?.avatarUrl
  );
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process and resize image file to efficient base64 data URL
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (PNG, JPG, WebP).');
      sounds.playError();
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image must be under 8MB.');
      sounds.playError();
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to 240x240 for fast WebSocket transfer and crisp avatar display
        const canvas = document.createElement('canvas');
        const maxSize = 240;
        let width = img.width;
        let height = img.height;

        // Crop square center
        const minDim = Math.min(width, height);
        const sx = (width - minDim) / 2;
        const sy = (height - minDim) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
          sounds.playSuccess();
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    sounds.playClick();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Display name cannot be empty.');
      sounds.playError();
      return;
    }
    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    sounds.playSuccess();
    onSaveProfile({
      name: cleanName,
      username: cleanUsername || 'player',
      avatarColor: color,
      avatarIcon: icon,
      avatarUrl,
      bio: bio.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-100">
                User Profile
              </h3>
              <p className="text-xs text-slate-400">
                Customize your identity, picture, and bio
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

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 mt-4">
          {/* Live Preview Card */}
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <UserAvatar
              user={{
                name,
                avatarColor: color,
                avatarIcon: icon,
                avatarUrl,
                isSpeaking: true
              }}
              size="xl"
              showSpeakingPulse={true}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <h4 className="font-bold text-slate-100 text-base truncate">
                  {name || 'Your Name'}
                </h4>
                <span className="text-xs text-indigo-400 font-mono">
                  @{username || 'username'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {bio || 'No bio yet.'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                  Profile Preview
                </span>
              </div>
            </div>
          </div>

          {/* Profile Picture Upload Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Camera size={14} className="text-indigo-400" />
              Profile Picture
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-950/40'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                  <Upload size={18} />
                </div>
                <div className="text-xs font-medium text-slate-200">
                  <span className="text-indigo-400 font-semibold underline">
                    Click to upload
                  </span>{' '}
                  or drag and drop photo
                </div>
                <span className="text-[11px] text-slate-500">
                  PNG, JPG, WebP up to 8MB
                </span>
              </div>
            </div>

            {avatarUrl && (
              <div className="mt-2 flex items-center justify-between text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <Check size={14} /> Custom photo active
                </span>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
                >
                  <Trash2 size={13} /> Remove Photo
                </button>
              </div>
            )}
          </div>

          {/* Name & Username Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Miller"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <AtSign size={12} className="text-indigo-400" />
                Username
              </label>
              <input
                type="text"
                value={username}
                maxLength={18}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                placeholder="e.g. alex_m"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Bio Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <FileText size={12} className="text-indigo-400" />
                Short Bio
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {bio.length}/140
              </span>
            </div>
            <textarea
              value={bio}
              maxLength={140}
              rows={2}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell friends a bit about yourself or gaming style..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          {/* Fallback Color & Icon selector (used if photo removed or as frame theme) */}
          <div className="pt-2 border-t border-slate-800">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Palette size={12} />
              Avatar Color & Fallback Icon
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => {
                    setColor(c);
                    sounds.playClick();
                  }}
                  className={`w-6 h-6 rounded-full flex-shrink-0 transition-transform ${
                    color === c
                      ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {AVATAR_ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => {
                    setIcon(ic);
                    sounds.playClick();
                  }}
                  className={`p-1.5 rounded-xl border flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserAvatar
                    user={{ avatarColor: color, avatarIcon: ic }}
                    size="xs"
                    showSpeakingPulse={false}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
