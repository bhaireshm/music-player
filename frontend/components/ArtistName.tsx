import { Text, TextProps } from '@mantine/core';
import { formatArtists } from '@/lib/artistUtils';

interface ArtistNameProps extends Omit<TextProps, 'children'> {
  artist: string | string[];
}

/**
 * Component to display artist name(s) with proper formatting
 * Handles both string and array formats
 */
export default function ArtistName({ artist, ...props }: ArtistNameProps) {
  const displayName = Array.isArray(artist) ? formatArtists(artist) : artist;
  
  return <Text {...props}>{displayName}</Text>;
}
