'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Song } from '@/lib/api';
import AudioPlayer from './AudioPlayer';

interface GlobalAudioPlayerContextType {
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
}

const GlobalAudioPlayerContext = createContext<GlobalAudioPlayerContextType | undefined>(undefined);

export function useGlobalAudioPlayer() {
  const context = useContext(GlobalAudioPlayerContext);
  if (!context) {
    throw new Error('useGlobalAudioPlayer must be used within GlobalAudioPlayerProvider');
  }
  return context;
}

interface GlobalAudioPlayerProviderProps {
  children: ReactNode;
}

export function GlobalAudioPlayerProvider({ children }: GlobalAudioPlayerProviderProps) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  return (
    <GlobalAudioPlayerContext.Provider value={{ currentSong, setCurrentSong }}>
      {children}
    </GlobalAudioPlayerContext.Provider>
  );
}
