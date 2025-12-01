'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Stack, NavLink, ScrollArea, Divider } from '@mantine/core';
import {
    IconMusic,
    IconPlaylist,
    IconHeart,
    IconCompass,
    IconCloudOff,
    IconSettings,
    IconUser
} from '@tabler/icons-react';

interface SidebarProps {
    onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const isActive = (path: string) => pathname === path;

    const handleNavigation = (path: string) => {
        router.push(path);
        onClose?.();
    };

    const links = [
        { icon: IconMusic, label: 'Library', path: '/library' },
        { icon: IconHeart, label: 'Favorites', path: '/favorites' },
        { icon: IconPlaylist, label: 'Playlists', path: '/playlists' },
        { icon: IconCompass, label: 'Discover', path: '/discover' },
        { icon: IconCloudOff, label: 'Offline', path: '/offline' },
    ];

    return (
        <Stack h="100%" gap={0}>




            <ScrollArea style={{ flex: 1 }}>
                <Stack gap={4} p="md">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            label={link.label}
                            leftSection={<link.icon size={20} stroke={1.5} />}
                            active={isActive(link.path)}
                            onClick={() => handleNavigation(link.path)}
                            variant="light"
                            color="primary"
                            style={{ borderRadius: 8 }}
                        />
                    ))}

                    <Divider my="sm" />

                    <NavLink
                        label="Profile"
                        leftSection={<IconUser size={20} stroke={1.5} />}
                        active={isActive('/profile')}
                        onClick={() => handleNavigation('/profile')}
                        variant="light"
                        style={{ borderRadius: 8 }}
                    />
                    <NavLink
                        label="Settings"
                        leftSection={<IconSettings size={20} stroke={1.5} />}
                        active={isActive('/settings')}
                        onClick={() => handleNavigation('/settings')}
                        variant="light"
                        style={{ borderRadius: 8 }}
                    />
                </Stack>
            </ScrollArea>
        </Stack>
    );
}
