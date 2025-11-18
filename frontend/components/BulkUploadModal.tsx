'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Modal,
  Button,
  Stack,
  Text,
  Group,
  Progress,
  Box,
  Alert,
  ScrollArea,
  Divider,
} from '@mantine/core';
import {
  IconUpload,
  IconX,
  IconPlayerPause,
  IconPlayerPlay,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { UploadQueueManager, UploadFile } from '@/lib/upload/uploadQueue';
import { uploadFileWithRetry } from '@/lib/upload/uploadWorker';
import { validateFiles, extractMetadataFromFilename } from '@/lib/upload/fileValidation';
import { UploadProgressItem } from './UploadProgressItem';

interface BulkUploadModalProps {
  opened: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function BulkUploadModal({ opened, onClose, onComplete }: BulkUploadModalProps) {
  const [queueManager] = useState(() => new UploadQueueManager(3));
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [invalidFiles, setInvalidFiles] = useState<Array<{ file: File; error: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  // Subscribe to queue changes
  useEffect(() => {
    const unsubscribe = queueManager.subscribe((state) => {
      setFiles(state.files);
      setIsPaused(state.isPaused);
    });

    return unsubscribe;
  }, [queueManager]);

  // Handle file selection
  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      const fileArray = Array.from(selectedFiles);
      const { valid, invalid } = validateFiles(fileArray);

      // Show validation errors
      if (invalid.length > 0) {
        setInvalidFiles(invalid);
      }

      // Add valid files to queue
      if (valid.length > 0) {
        const uploadFiles: UploadFile[] = valid.map((file) => {
          const metadata = extractMetadataFromFilename(file.name);
          return {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            status: 'pending' as const,
            progress: 0,
          };
        });

        queueManager.addFiles(uploadFiles);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [queueManager]
  );

  // Process upload queue
  const processQueue = useCallback(async () => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setIsUploading(true);

    while (true) {
      const nextFile = queueManager.getNextFile();
      
      if (!nextFile) {
        // Check if we're done
        if (queueManager.isComplete()) {
          break;
        }
        // Wait a bit and check again
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      // Mark as uploading
      queueManager.updateFileStatus(nextFile.id, 'uploading');
      queueManager.incrementActiveUploads();

      // Upload file (don't await - let it run concurrently)
      uploadFileWithRetry({
        file: nextFile.file,
        title: nextFile.title,
        artist: nextFile.artist,
        album: nextFile.album,
        onProgress: (progress) => {
          queueManager.updateFileProgress(nextFile.id, progress);
        },
      })
        .then((result) => {
          if (result.success) {
            queueManager.updateFileStatus(nextFile.id, 'complete');
          } else {
            queueManager.updateFileStatus(nextFile.id, 'failed', result.error);
          }
        })
        .finally(() => {
          queueManager.decrementActiveUploads();
        });
    }

    uploadingRef.current = false;
    setIsUploading(false);

    // Show completion notification
    const stats = queueManager.getStats();
    if (stats.complete > 0) {
      notifications.show({
        title: 'Upload Complete',
        message: `Successfully uploaded ${stats.complete} of ${stats.total} files`,
        color: stats.failed > 0 ? 'yellow' : 'green',
        icon: <IconCheck size={18} />,
      });

      if (onComplete) {
        onComplete();
      }
    }
  }, [queueManager, onComplete]);

  // Start upload
  const handleStartUpload = useCallback(() => {
    if (files.length === 0) return;
    processQueue();
  }, [files.length, processQueue]);

  // Pause/Resume
  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      queueManager.resume();
      processQueue();
    } else {
      queueManager.pause();
    }
  }, [isPaused, queueManager, processQueue]);

  // Cancel all
  const handleCancel = useCallback(() => {
    queueManager.clear();
    setInvalidFiles([]);
    onClose();
  }, [queueManager, onClose]);

  // Retry failed
  const handleRetryAll = useCallback(() => {
    queueManager.retryAll();
    processQueue();
  }, [queueManager, processQueue]);

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const stats = queueManager.getStats();
  const overallProgress = stats.total > 0 ? ((stats.complete / stats.total) * 100) : 0;

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title="Bulk Upload Songs"
      size="xl"
      centered
    >
      <Stack gap="md">
        {/* File Selection */}
        {files.length === 0 && (
          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <IconUpload size={48} style={{ margin: '0 auto', opacity: 0.5 }} />
            <Text size="lg" fw={500} mt="md">
              Drop audio files here or click to browse
            </Text>
            <Text size="sm" c="dimmed" mt="xs">
              Supports MP3, WAV, OGG, FLAC, AAC, M4A (max 100MB per file)
            </Text>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </Box>
        )}

        {/* Invalid Files Alert */}
        {invalidFiles.length > 0 && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Some files were rejected"
            color="red"
            withCloseButton
            onClose={() => setInvalidFiles([])}
          >
            <Stack gap="xs">
              {invalidFiles.map((item, index) => (
                <Text key={index} size="sm">
                  {item.file.name}: {item.error}
                </Text>
              ))}
            </Stack>
          </Alert>
        )}

        {/* Upload Progress */}
        {files.length > 0 && (
          <>
            {/* Overall Progress */}
            <Box>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>
                  Overall Progress
                </Text>
                <Text size="sm" c="dimmed">
                  {stats.complete} / {stats.total} complete
                </Text>
              </Group>
              <Progress value={overallProgress} size="lg" />
            </Box>

            <Divider />

            {/* File List */}
            <ScrollArea h={400}>
              <Stack gap="xs">
                {files.map((file) => (
                  <UploadProgressItem
                    key={file.id}
                    file={file}
                    onRetry={() => {
                      queueManager.retryFile(file.id);
                      processQueue();
                    }}
                    onRemove={() => queueManager.removeFile(file.id)}
                    onMetadataChange={(metadata) =>
                      queueManager.updateFileMetadata(file.id, metadata)
                    }
                  />
                ))}
              </Stack>
            </ScrollArea>

            {/* Actions */}
            <Group justify="space-between">
              <Group>
                {!isUploading && stats.pending > 0 && (
                  <Button
                    leftSection={<IconUpload size={16} />}
                    onClick={handleStartUpload}
                  >
                    Start Upload
                  </Button>
                )}

                {isUploading && (
                  <Button
                    leftSection={isPaused ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
                    onClick={handlePauseResume}
                    variant="light"
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                )}

                {stats.failed > 0 && (
                  <Button onClick={handleRetryAll} variant="light" color="orange">
                    Retry Failed ({stats.failed})
                  </Button>
                )}

                <Button
                  leftSection={<IconUpload size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                  variant="subtle"
                >
                  Add More Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </Group>

              <Button
                leftSection={<IconX size={16} />}
                onClick={handleCancel}
                variant="subtle"
                color="gray"
              >
                Close
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
