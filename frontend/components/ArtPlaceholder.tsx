import { Box, BoxProps } from '@mantine/core';
import { useMemo } from 'react';

interface ArtPlaceholderProps extends BoxProps {
    id: string;
    size?: number | string;
    radius?: number | string;
}

export function ArtPlaceholder({ id, size = 48, radius = 'sm', style, ...others }: ArtPlaceholderProps) {
    const background = useMemo(() => {
        // Simple hash function to generate a deterministic seed from the ID
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = (id.codePointAt(i) || 0) + ((hash << 5) - hash);
        }

        // Generate two colors based on the hash
        const h1 = Math.abs(hash % 360);
        const h2 = Math.abs((hash >> 8) % 360);

        // Use HSL for vibrant colors
        const color1 = `hsl(${h1}, 70%, 60%)`;
        const color2 = `hsl(${h2}, 70%, 40%)`;

        // Random-ish angle
        const angle = Math.abs((hash >> 4) % 360);

        return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
    }, [id]);

    return (
        <Box
            style={{
                width: size,
                height: size,
                minWidth: size, // Prevent shrinking
                minHeight: size,
                borderRadius: typeof radius === 'number' ? `${radius}px` : `var(--mantine-radius-${radius})`,
                background: background,
                ...style,
            }}
            {...others}
        />
    );
}
