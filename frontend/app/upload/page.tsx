'use client';

import { useRef, useState, useCallback } from 'react';
// Unused imports removed
import {
    Container,
    Title,
    Text,
    Group,
    Stack,
    Button,
    Box,
    SimpleGrid,
    Paper,
    ActionIcon,
    Progress,
    ScrollArea,
    TextInput,
    Collapse
} from '@mantine/core';
import {
    IconUpload,
    IconPlayerPlay,
    IconPlayerPause,
    IconX,
    IconRefresh,
    IconCheck,
    IconEdit,
    IconTrash
} from '@tabler/icons-react';
import { useUpload } from '@/contexts/UploadContext';
import { UploadProgressItem } from '@/components/UploadProgressItem';
import { UploadFile } from '@/lib/upload/uploadQueue';

export default function UploadPage() {
    const {
        files,
        isUploading,
        isPaused,
        stats,
        addFiles,
        startUpload,
        pauseUpload,
        resumeUpload,
        retryAllFailed,
        retryFile,
        removeFile,
        updateFileMetadata,
        clearCompleted
    } = useUpload();

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter files for the two columns
    const activeFiles = files.filter(f => f.status === 'pending' || f.status === 'uploading' || f.status === 'paused');
    const failedFiles = files.filter(f => f.status === 'failed');

    // completedFiles removed as it was unused

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        addFiles(Array.from(e.dataTransfer.files));
    }, [addFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const overallProgress = stats.total > 0 ? ((stats.complete / stats.total) * 100) : 0;

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="lg">
                <Title order={2}>Upload Songs</Title>
                <Group>
                    {stats.complete > 0 && (
                        <Button variant="subtle" color="gray" onClick={clearCompleted}>
                            Clear Completed ({stats.complete})
                        </Button>
                    )}
                    <Button
                        leftSection={<IconUpload size={16} />}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Add Files
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="audio/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            if (e.target.files) {
                                addFiles(Array.from(e.target.files));
                                e.target.value = ''; // Reset
                            }
                        }}
                    />
                </Group>
            </Group>

            {/* Progress Stats Bar */}
            {files.length > 0 && (
                <Paper p="md" mb="xl" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Total Progress</Text>
                        <Group gap="md">
                            <Text size="sm" c="green">✓ {stats.complete}</Text>
                            <Text size="sm" c="red">✗ {stats.failed}</Text>
                            <Text size="sm" c="blue">↑ {stats.uploading}</Text>
                            <Text size="sm" c="dimmed">⋯ {stats.pending}</Text>
                        </Group>
                    </Group>
                    <Progress value={overallProgress} size="lg" radius="md" />

                    <Group mt="md">
                        {!isUploading && stats.pending > 0 && (
                            <Button onClick={startUpload} size="xs" leftSection={<IconPlayerPlay size={14} />}>
                                Start Upload
                            </Button>
                        )}
                        {isUploading && (
                            <Button
                                onClick={isPaused ? resumeUpload : pauseUpload}
                                size="xs"
                                variant="light"
                                leftSection={isPaused ? <IconPlayerPlay size={14} /> : <IconPlayerPause size={14} />}
                            >
                                {isPaused ? 'Resume' : 'Pause'}
                            </Button>
                        )}
                    </Group>
                </Paper>
            )}

            {files.length === 0 && (
                <Box
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{
                        border: '2px dashed var(--mantine-color-gray-4)',
                        borderRadius: '8px',
                        padding: '60px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: 'var(--mantine-color-gray-0)',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <IconUpload size={48} style={{ margin: '0 auto', opacity: 0.5 }} />
                    <Text size="lg" fw={500} mt="md">
                        Drop audio files here or click to browse
                    </Text>
                    <Text size="sm" c="dimmed" mt="xs">
                        Supports MP3, WAV, OGG, FLAC (max 100MB)
                    </Text>
                </Box>
            )}

            {files.length > 0 && (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>

                    {/* LEFT COLUMN: Active / Pending */}
                    <Stack>
                        <Title order={4} c="dimmed">Active Queue ({activeFiles.length})</Title>
                        <ScrollArea h="calc(100vh - 300px)" type="auto" offsetScrollbars>
                            <Stack gap="sm" pb="md">
                                {activeFiles.map(file => (
                                    <UploadProgressItem
                                        key={file.id}
                                        file={file}
                                        onRetry={() => retryFile(file.id)}
                                        onRemove={() => removeFile(file.id)}
                                        onMetadataChange={(m) => updateFileMetadata(file.id, m)}
                                    />
                                ))}
                                {activeFiles.length === 0 && files.length > 0 && (
                                    <Text c="dimmed" size="sm" fs="italic">No pending uploads.</Text>
                                )}
                            </Stack>
                        </ScrollArea>
                    </Stack>

                    {/* RIGHT COLUMN: Failed Uploads */}
                    <Stack>
                        <Group justify="space-between">
                            <Title order={4} c="red">Failed ({failedFiles.length})</Title>
                            <Group gap="xs">
                                {failedFiles.some(f => f.error?.toLowerCase().includes('exists') || f.error?.toLowerCase().includes('duplicate')) && (
                                    <Button
                                        variant="subtle"
                                        color="gray"
                                        size="xs"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={() => {
                                            failedFiles.forEach(f => {
                                                if (f.error?.toLowerCase().includes('exists') || f.error?.toLowerCase().includes('duplicate')) {
                                                    removeFile(f.id);
                                                }
                                            });
                                        }}
                                    >
                                        Clear Duplicates
                                    </Button>
                                )}
                                {failedFiles.length > 0 && (
                                    <Button
                                        variant="light"
                                        color="red"
                                        size="xs"
                                        leftSection={<IconRefresh size={14} />}
                                        onClick={retryAllFailed}
                                    >
                                        Retry All
                                    </Button>
                                )}
                            </Group>
                        </Group>
                        <ScrollArea h="calc(100vh - 300px)" type="auto" offsetScrollbars>
                            <Stack gap="sm" pb="md">
                                {failedFiles.map(file => (
                                    <FailedUploadItem
                                        key={file.id}
                                        file={file}
                                        onRetry={() => retryFile(file.id)}
                                        onRemove={() => removeFile(file.id)}
                                        onSaveMetadata={(m) => updateFileMetadata(file.id, m)}
                                    />
                                ))}
                                {failedFiles.length === 0 && (
                                    <Paper p="xl" withBorder style={{ textAlign: 'center', opacity: 0.5 }}>
                                        <IconCheck size={32} style={{ margin: '0 auto' }} color="green" />
                                        <Text size="sm" mt="sm">No failed uploads</Text>
                                    </Paper>
                                )}
                            </Stack>
                        </ScrollArea>
                    </Stack>

                </SimpleGrid>
            )}
        </Container>
    );
}

import { ArtPlaceholder } from '@/components/ArtPlaceholder';

// ... (other imports)

// Inline component for Failed Items to reduce boilerplate and allow specific styling
function FailedUploadItem({
    file,
    onRetry,
    onRemove,
    onSaveMetadata
}: {
    file: UploadFile,
    onRetry: () => void,
    onRemove: () => void,
    onSaveMetadata: (m: { title: string, artist: string }) => void
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(file.title);
    const [artist, setArtist] = useState(file.artist);

    const handleSave = () => {
        onSaveMetadata({ title, artist });
        setIsEditing(false);
    };

    return (
        <Paper p="sm" withBorder style={{ borderColor: 'var(--mantine-color-red-3)', backgroundColor: 'var(--mantine-color-red-0)' }}>
            <Group justify="space-between" mb="xs" wrap="nowrap" align="flex-start">
                <ArtPlaceholder id={file.id} size={48} />
                <Box style={{ flex: 1, overflow: 'hidden' }}>
                    <Text size="sm" fw={600} truncate>{file.title}</Text>
                    <Text size="xs" truncate>{file.artist}</Text>
                </Box>
                <Group gap={4}>
                    <ActionIcon color="red" variant="subtle" onClick={onRemove}><IconX size={16} /></ActionIcon>
                </Group>
            </Group>

            <Text size="xs" c="red" mb="xs">{file.error || 'Upload failed'}</Text>

            <Collapse in={isEditing}>
                <Box mb="xs">
                    <TextInput
                        size="xs"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        mb={4}
                    />
                    <TextInput
                        size="xs"
                        placeholder="Artist"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                    />
                </Box>
            </Collapse>

            <Group justify="flex-end" gap="xs" mt="xs">
                {isEditing ? (
                    <Button size="compact-xs" onClick={handleSave} color="blue" leftSection={<IconCheck size={14} />}>Save</Button>
                ) : (
                    <Button size="compact-xs" variant="subtle" color="gray" onClick={() => setIsEditing(true)} leftSection={<IconEdit size={14} />}>Edit</Button>
                )}
                <Button size="compact-xs" color="red" variant="light" onClick={onRetry} leftSection={<IconRefresh size={14} />}>Retry</Button>
            </Group>
        </Paper>
    );
}
