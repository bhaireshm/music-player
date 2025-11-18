import { ReactNode } from 'react';
import { Tooltip } from '@mantine/core';
import { KeyboardShortcut, formatShortcut } from '@/lib/keyboardShortcuts';

interface ShortcutTooltipProps {
  children: ReactNode;
  shortcut: KeyboardShortcut;
  label?: string;
}

/**
 * Wrapper component that adds keyboard shortcut tooltip to any element
 */
export function ShortcutTooltip({ children, shortcut, label }: ShortcutTooltipProps) {
  const formattedShortcut = formatShortcut(shortcut);
  const tooltipLabel = label 
    ? `${label} (${formattedShortcut})`
    : formattedShortcut;

  return (
    <Tooltip label={tooltipLabel} withArrow>
      {children}
    </Tooltip>
  );
}
