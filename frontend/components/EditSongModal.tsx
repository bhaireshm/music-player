'use client';

import { useState, useEffect } from 'react';
import { Modal, TextInput, Textarea, Button, Stack, Group, MultiSelect } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Song, updateSong } from '@/lib/api';

interface EditSongModalProps {
    opened: boolean;
    onClose: () => void;
    song: Song;
    onSuccess: () => void;
}

export default function EditSongModal({ opened, onClose, song, onSuccess }: EditSongModalProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            title: '',
            artist: '',
            album: '',
            year: '',
            genre: [] as string[],
            lyrics: '',
        },
        validate: {
            title: (value) => (value.trim().length > 0 ? null : 'Title is required'),
            artist: (value) => (value.trim().length > 0 ? null : 'Artist is required'),
        },
    });

    // Update form values when song changes
    useEffect(() => {
        if (song) {
            form.setValues({
                title: song.title || '',
                artist: song.artist || '',
                album: song.album || '',
                year: song.year || '',
                genre: song.genre ? song.genre.split(',').map(g => g.trim()) : [],
                lyrics: song.lyrics || '',
            });
        }
    }, [song]);

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        try {
            await updateSong(song.id, {
                title: values.title,
                artist: values.artist,
                album: values.album,
                year: values.year,
                genre: values.genre.join(', '),
                lyrics: values.lyrics,
            });

            notifications.show({
                title: 'Success',
                message: 'Song updated successfully',
                color: 'green',
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to update song:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to update song',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Edit Song" size="lg">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        label="Title"
                        placeholder="Song title"
                        required
                        {...form.getInputProps('title')}
                    />
                    <TextInput
                        label="Artist"
                        placeholder="Artist name"
                        required
                        {...form.getInputProps('artist')}
                    />
                    <Group grow>
                        <TextInput
                            label="Album"
                            placeholder="Album name"
                            {...form.getInputProps('album')}
                        />
                        <TextInput
                            label="Year"
                            placeholder="Release year"
                            {...form.getInputProps('year')}
                        />
                    </Group>
                    <MultiSelect
                        label="Genre"
                        placeholder="Select genres"
                        data={['Pop', 'Rock', 'Hip Hop', 'R&B', 'Jazz', 'Classical', 'Electronic', 'Dance', 'Indie', 'Alternative', 'Country', 'Folk', 'Latin', 'Metal', 'Punk', 'Soul', 'Blues', 'Reggae', 'Funk', 'Disco']}
                        searchable
                        {...form.getInputProps('genre')}
                    />
                    <Textarea
                        label="Lyrics"
                        placeholder="Paste lyrics here..."
                        minRows={6}
                        maxRows={12}
                        autosize
                        {...form.getInputProps('lyrics')}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={onClose}>Cancel</Button>
                        <Button type="submit" loading={loading}>Save Changes</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
