import { useState } from 'react';
import { Song, deleteSong } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';

interface UseSongActionsOptions {
    onDeleteSuccess?: () => void;
    onEditSuccess?: () => void;
}

/**
 * Custom hook for song actions (edit, delete)
 * Provides consistent permission checks and handlers
 */
export function useSongActions(song: Song, options: UseSongActionsOptions = {}) {
    const { user } = useAuth();
    const { queue, removeFromQueue } = useAudioPlayerContext();
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Permission checks
    const isOwner = user && song && user.uid === song.uploadedBy;
    const canEdit = isOwner;
    const canDelete = isOwner;

    /**
     * Open edit modal
     */
    const handleEdit = () => {
        setEditModalOpen(true);
    };

    /**
     * Delete song with confirmation
     */
    const handleDelete = () => {
        modals.openConfirmModal({
            title: 'Delete Song',
            centered: true,
            children: `Are you sure you want to delete "${song.title}"? This action cannot be undone.`,
            labels: { confirm: 'Delete', cancel: 'Cancel' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await deleteSong(song.id);

                    // Remove from queue if present
                    const queueIndex = queue.findIndex(s => s.id === song.id);
                    if (queueIndex !== -1) {
                        removeFromQueue(queueIndex);
                    }

                    notifications.show({
                        title: 'Success',
                        message: 'Song deleted successfully',
                        color: 'green',
                    });

                    // Call success callback
                    if (options.onDeleteSuccess) {
                        options.onDeleteSuccess();
                    }
                } catch (error) {
                    console.error('Failed to delete song:', error);
                    notifications.show({
                        title: 'Error',
                        message: 'Failed to delete song',
                        color: 'red',
                    });
                }
            },
        });
    };

    /**
     * Close edit modal
     */
    const closeEditModal = () => {
        setEditModalOpen(false);
    };

    return {
        // State
        editModalOpen,

        // Permissions
        canEdit,
        canDelete,
        isOwner,

        // Handlers
        handleEdit,
        handleDelete,
        setEditModalOpen,
        closeEditModal,
    };
}
