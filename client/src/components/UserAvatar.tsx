import React, { useState } from 'react';

interface UserAvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-lg'
};

const getUserInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  src,
  size = 'md',
  className = ''
}) => {
  const [failedSrc, setFailedSrc] = useState<string>('');

  const trimmedSrc = (src || '').trim();
  const showImage = Boolean(trimmedSrc) && failedSrc !== trimmedSrc;
  const sizeClass = SIZE_CLASSES[size];

  if (showImage) {
    return (
      <img
        src={trimmedSrc}
        alt={name || 'User profile'}
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(trimmedSrc)}
        className={`${sizeClass} rounded-full object-cover ring-1 ring-[#FF5A1F]/70 bg-[#1C1C1C] shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name || 'User avatar'}
      className={`${sizeClass} rounded-full bg-[#FF5A1F] text-white font-bold flex items-center justify-center ring-1 ring-[#292929] shadow-sm shrink-0 select-none ${className}`}
    >
      {getUserInitials(name)}
    </div>
  );
};
