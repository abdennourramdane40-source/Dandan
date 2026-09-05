import React from 'react';
import {
  Cat,
  Zap,
  Smile,
  Gamepad2,
  Sparkles,
  Flame,
  Rocket,
  Star,
  Crown
} from 'lucide-react';
import { User } from '../types';

interface UserAvatarProps {
  user: Partial<User>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSpeakingPulse?: boolean;
  showCrown?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showSpeakingPulse = true,
  showCrown = false,
  className = ''
}) => {
  const [imageError, setImageError] = React.useState(false);
  const iconName = user.avatarIcon || 'smile';
  const color = user.avatarColor || '#3b82f6';
  const isSpeaking = user.isSpeaking && showSpeakingPulse;
  const avatarUrl = user.avatarUrl;

  // Reset image error if avatarUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  }[size];

  const iconSizes = {
    xs: 12,
    sm: 15,
    md: 20,
    lg: 28,
    xl: 38,
    '2xl': 46
  }[size];

  const renderIcon = () => {
    switch (iconName) {
      case 'cat':
        return <Cat size={iconSizes} />;
      case 'zap':
        return <Zap size={iconSizes} />;
      case 'gamepad':
        return <Gamepad2 size={iconSizes} />;
      case 'sparkles':
        return <Sparkles size={iconSizes} />;
      case 'flame':
        return <Flame size={iconSizes} />;
      case 'rocket':
        return <Rocket size={iconSizes} />;
      case 'star':
        return <Star size={iconSizes} />;
      case 'smile':
      default:
        return <Smile size={iconSizes} />;
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}>
      {/* Speaking ring */}
      {isSpeaking && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-60 pointer-events-none"
          style={{ backgroundColor: color }}
        />
      )}

      <div
        className={`rounded-full flex items-center justify-center text-white shadow-md transition-all relative z-10 overflow-hidden ${sizeClasses} ${
          isSpeaking ? 'ring-2 ring-emerald-400 scale-105' : 'ring-1 ring-white/20'
        }`}
        style={{ backgroundColor: color }}
      >
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt={user.name || 'User'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          renderIcon()
        )}
      </div>

      {showCrown && user.isHost && (
        <span
          title="Room Host"
          className="absolute -top-1 -right-1 z-20 bg-amber-400 text-amber-950 p-0.5 rounded-full shadow border border-amber-200"
        >
          <Crown size={size === 'xs' || size === 'sm' ? 10 : 12} className="fill-amber-950" />
        </span>
      )}
    </div>
  );
};
