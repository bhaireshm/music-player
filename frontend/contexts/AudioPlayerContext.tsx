'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAudioPlayer, UseAudioPlayerReturn } from '@/hooks/useAudioPlayer';

const AudioPlayerContext = createContext<UseAudioPlayerReturn | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioPlayer = useAudioPlayer();

  return (
    <AudioPlayerContext.Provider value={audioPlayer}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayerContext(): UseAudioPlayerReturn {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
  }
  return context;
}
