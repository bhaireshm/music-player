'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PlaylistVisibility = 'private' | 'shared' | 'public';

interface PlaylistSharingState {
  visibility: PlaylistVisibility;
  collaborators: string[];
  followers: string[];
  isOwner: boolean;
  canEdit: boolean;
  shareLink: string;
}

interface PlaylistSharingContextType {
  sharingState: PlaylistSharingState | null;
  setSharingState: (state: PlaylistSharingState | null) => void;
  updateVisibility: (visibility: PlaylistVisibility) => void;
  addCollaborator: (collaboratorId: string) => void;
  removeCollaborator: (collaboratorId: string) => void;
  addFollower: (followerId: string) => void;
  removeFollower: (followerId: string) => void;
}

const PlaylistSharingContext = createContext<PlaylistSharingContextType | undefined>(
  undefined
);

export function PlaylistSharingProvider({ children }: { children: ReactNode }) {
  const [sharingState, setSharingState] = useState<PlaylistSharingState | null>(null);

  const updateVisibility = (visibility: PlaylistVisibility) => {
    if (sharingState) {
      setSharingState({
        ...sharingState,
        visibility,
      });
    }
  };

  const addCollaborator = (collaboratorId: string) => {
    if (sharingState && !sharingState.collaborators.includes(collaboratorId)) {
      setSharingState({
        ...sharingState,
        collaborators: [...sharingState.collaborators, collaboratorId],
      });
    }
  };

  const removeCollaborator = (collaboratorId: string) => {
    if (sharingState) {
      setSharingState({
        ...sharingState,
        collaborators: sharingState.collaborators.filter(
          (id) => id !== collaboratorId
        ),
      });
    }
  };

  const addFollower = (followerId: string) => {
    if (sharingState && !sharingState.followers.includes(followerId)) {
      setSharingState({
        ...sharingState,
        followers: [...sharingState.followers, followerId],
      });
    }
  };

  const removeFollower = (followerId: string) => {
    if (sharingState) {
      setSharingState({
        ...sharingState,
        followers: sharingState.followers.filter((id) => id !== followerId),
      });
    }
  };

  return (
    <PlaylistSharingContext.Provider
      value={{
        sharingState,
        setSharingState,
        updateVisibility,
        addCollaborator,
        removeCollaborator,
        addFollower,
        removeFollower,
      }}
    >
      {children}
    </PlaylistSharingContext.Provider>
  );
}

export function usePlaylistSharing() {
  const context = useContext(PlaylistSharingContext);
  if (context === undefined) {
    throw new Error(
      'usePlaylistSharing must be used within a PlaylistSharingProvider'
    );
  }
  return context;
}
