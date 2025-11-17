'use client';

import { Avatar } from '@mantine/core';

interface UserAvatarProps {
  avatarUrl?: string;
  displayName?: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function UserAvatar({
  avatarUrl,
  displayName,
  email,
  size = 'md',
}: UserAvatarProps) {
  const getInitials = () => {
    if (displayName) {
      const parts = displayName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 80,
    xl: 120,
  };

  return (
    <Avatar
      src={avatarUrl}
      alt={displayName || email || 'User'}
      size={sizeMap[size]}
      radius="xl"
    >
      {getInitials()}
    </Avatar>
  );
}
