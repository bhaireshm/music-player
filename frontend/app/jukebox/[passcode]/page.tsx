'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJukebox } from '@/context/JukeboxContext';
import { useAuth } from '@/hooks/useAuth';
import { Center, Loader, Text, Stack } from '@mantine/core';

export default function JukeboxSessionPage() {
    const params = useParams();
    const router = useRouter();
    const { joinSession, session } = useJukebox();
    const { user } = useAuth();
    const passcode = params.passcode as string;

    useEffect(() => {
        if (passcode && !session) {
            // Auto-join session based on URL passcode
            const userId = user?.uid || `guest_${Math.random().toString(36).substring(2, 9)}`;
            const userName = user?.displayName || 'Guest';

            joinSession(passcode, { id: userId, name: userName });
        }
    }, [passcode, session, joinSession, user]);

    // If session is loaded, redirect to main jukebox page
    // The main page will now display the party automatically
    useEffect(() => {
        if (session) {
            router.push('/jukebox');
        }
    }, [session, router]);

    return (
        <Center h="100vh">
            <Stack align="center">
                <Loader size="lg" />
                <Text size="lg">Joining Party {passcode}...</Text>
            </Stack>
        </Center>
    );
}
