'use client';

import { Badge } from '@mantine/core';
import { IconLock, IconUsers, IconWorld } from '@tabler/icons-react';

interface VisibilityBadgeProps {
  visibility: 'private' | 'shared' | 'public';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function VisibilityBadge({ visibility, size = 'sm' }: VisibilityBadgeProps) {
  const config = {
    private: {
      color: 'gray',
      icon: IconLock,
      label: 'Private',
    },
    shared: {
      color: 'blue',
      icon: IconUsers,
      label: 'Shared',
    },
    public: {
      color: 'green',
      icon: IconWorld,
      label: 'Public',
    },
  };

  const { color, icon: Icon, label } = config[visibility];

  return (
    <Badge
      color={color}
      variant="light"
      size={size}
      leftSection={<Icon size={12} />}
    >
      {label}
    </Badge>
  );
}
