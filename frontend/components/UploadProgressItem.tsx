'use client';

import { useState } from 'react';
import {
  Box,
  Group,
  Text,
  Progress,
  ActionIcon,
  TextInput,
  Collapse,
  Badge,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
  IconEdit,
  IconChevronUp,
} from '@tabler/icons-react';
import { UploadFile } from '@/lib/upload/uploadQueue';
import { formatFileSize, getFileExtension } from '@/lib/upload/fileValidation';

interface UploadProgressItemProps {
  file: UploadFile;
  onRetry: () => void;
  onRemove: () => void;
  onMetadataChange: (metadata: { title?: string; artist?: string; album?: string }) => void;
}

export function UploadProgressItem({
  file,
  onRetry,
  onRemove,
  onMetadataChange,
}: UploadProgressItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(file.title);
  const [editedArtist, setEditedArtist] = useState(file.artist);
  const [editedAlbum, setEditedAlbum] = useState(file.album || '');

  const handleSaveMetadata = () => {
    onMetadataChange({
      title: editedTitle,
      artist: editedArtist,
      album: editedAlbum || undefined,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(file.title);
    setEditedArtist(file.artist);
    setEditedAlbum(file.album || '');
    setIsEditing(false);
  };

  const getStatusColor = () => {
    switch (file.status) {
      case 'complete':
        return 'green';
      case 'failed':
        return 'red';
      case 'uploading':
        return 'blue';
      case 'paused':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case 'complete':
        return <IconCheck size={16} />;
      case 'failed':
        return <IconAlertCircle size={16} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case 'pending':
        return 'Pending';
      case 'uploading':
        return `Uploading ${file.progress.toFixed(0)}%`;
      case 'complete':
        return 'Complete';
      case 'failed':
        return 'Failed';
      case 'paused':
        return 'Paused';
      default:
        return '';
    }
  };

  return (
    <Box
      p="md"
      style={(theme) => ({
        border: `1px solid ${theme.colors.gray[3]}`,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.gray[0],
      })}
    >
      <Group justify="space-between" wrap="nowrap">
        <Box style={{ flex: 1, minWidth: 0 }}>
          {/* File Info */}
          <Group gap="xs" mb="xs">
            <Badge size="xs" color={getStatusColor()}>
              {getFileExtension(file.file.name)}
            </Badge>
            <Text size="sm" fw={500} truncate style={{ flex: 1 }}>
              {file.title}
            </Text>
            {getStatusIcon()}
          </Group>

          <Text size="xs" c="dimmed" truncate>
            {file.artist} {file.album && `• ${file.album}`} • {formatFileSize(file.file.size)}
          </Text>

          {/* Progress Bar */}
          {(file.status === 'uploading' || file.status === 'paused') && (
            <Progress value={file.progress} size="sm" mt="xs" color={getStatusColor()} />
          )}

          {/* Status Text */}
          <Text size="xs" c={getStatusColor()} mt="xs">
            {getStatusText()}
          </Text>

          {/* Error Message */}
          {file.error && (
            <Text size="xs" c="red" mt="xs">
              {file.error}
            </Text>
          )}
        </Box>

        {/* Actions */}
        <Group gap="xs">
          {file.status === 'pending' && (
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => setIsEditing(!isEditing)}
              title="Edit metadata"
            >
              {isEditing ? <IconChevronUp size={18} /> : <IconEdit size={18} />}
            </ActionIcon>
          )}

          {file.status === 'failed' && (
            <ActionIcon
              variant="subtle"
              color="orange"
              onClick={onRetry}
              title="Retry upload"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          )}

          {(file.status === 'pending' || file.status === 'failed') && (
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={onRemove}
              title="Remove file"
            >
              <IconX size={18} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {/* Metadata Editor */}
      <Collapse in={isEditing}>
        <Box mt="md" pt="md" style={(theme) => ({ borderTop: `1px solid ${theme.colors.gray[3]}` })}>
          <TextInput
            label="Title"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            size="sm"
            mb="xs"
          />
          <TextInput
            label="Artist"
            value={editedArtist}
            onChange={(e) => setEditedArtist(e.target.value)}
            size="sm"
            mb="xs"
          />
          <TextInput
            label="Album (optional)"
            value={editedAlbum}
            onChange={(e) => setEditedAlbum(e.target.value)}
            size="sm"
            mb="md"
          />
          <Group justify="flex-end">
            <ActionIcon variant="subtle" color="gray" onClick={handleCancelEdit}>
              <IconX size={18} />
            </ActionIcon>
            <ActionIcon variant="filled" color="blue" onClick={handleSaveMetadata}>
              <IconCheck size={18} />
            </ActionIcon>
          </Group>
        </Box>
      </Collapse>
    </Box>
  );
}
