'use client';

import { Modal, Text, Stack, Group, Box, useMantineTheme, Badge } from '@mantine/core';
import { getShortcutsByCategory, formatShortcut } from '@/lib/keyboardShortcuts';

interface KeyboardShortcutsModalProps {
  opened: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ opened, onClose }: KeyboardShortcutsModalProps) {
  const theme = useMantineTheme();
  const shortcutsByCategory = getShortcutsByCategory();

  const categoryTitles = {
    playback: 'Playback Controls',
    navigation: 'Navigation',
    general: 'General',
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="xl" fw={700}>
          Keyboard Shortcuts
        </Text>
      }
      size="lg"
      centered
    >
      <Stack gap="xl">
        {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
          <Box key={category}>
            <Text size="sm" fw={600} c="dimmed" mb="sm" tt="uppercase">
              {categoryTitles[category as keyof typeof categoryTitles]}
            </Text>
            <Stack gap="xs">
              {shortcuts.map(({ id, shortcut }) => (
                <Group key={id} justify="space-between" wrap="nowrap">
                  <Text size="sm">{shortcut.description}</Text>
                  <Badge
                    variant="light"
                    color="accent1"
                    size="lg"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {formatShortcut(shortcut)}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Box>
        ))}

        <Box
          p="md"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.accent1[1]} 0%, ${theme.colors.secondary[1]} 100%)`,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.accent1[3]}`,
          }}
        >
          <Text size="xs" c="dimmed" ta="center">
            Press <Badge size="sm" variant="light" color="accent1">Esc</Badge> to close this dialog
          </Text>
        </Box>
      </Stack>
    </Modal>
  );
}
