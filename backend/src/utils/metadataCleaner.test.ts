import { cleanMetadataString, removeTrackNumbers, cleanMetadata } from './metadataCleaner';

describe('metadataCleaner', () => {
    describe('cleanMetadataString', () => {
        test('removes URLs from strings', () => {
            expect(cleanMetadataString('Song Name https://example.com')).toBe('Song Name');
            expect(cleanMetadataString('Artist www.website.com')).toBe('Artist');
            expect(cleanMetadataString('http://test.com/song Song Title')).toBe('Song Title');
        });

        test('removes domain names', () => {
            expect(cleanMetadataString('Song Name example.com')).toBe('Song Name');
            expect(cleanMetadataString('Artist website.net')).toBe('Artist');
            expect(cleanMetadataString('Kannadamasti.cc Song')).toBe('Song');
        });

        test('removes promotional phrases', () => {
            expect(cleanMetadataString('Song downloaded from site.com')).toBe('Song');
            expect(cleanMetadataString('Track uploaded by user')).toBe('Track');
        });

        test('removes empty brackets and parentheses', () => {
            expect(cleanMetadataString('Song Name ()')).toBe('Song Name');
            expect(cleanMetadataString('Artist []')).toBe('Artist');
            expect(cleanMetadataString('Song () Name []')).toBe('Song  Name');
        });

        test('handles nested parentheses with domains', () => {
            expect(cleanMetadataString('Na Huduko (Kannadamasti.cc)')).toBe('Na Huduko');
            expect(cleanMetadataString('Premier Padmini (Kannadamasti.Cc)')).toBe('Premier Padmini');
        });
    });

    describe('removeTrackNumbers', () => {
        test('removes leading track numbers with space', () => {
            expect(removeTrackNumbers('01 Song Name')).toBe('Song Name');
            expect(removeTrackNumbers('1 Song Name')).toBe('Song Name');
            expect(removeTrackNumbers('001 Song Name')).toBe('Song Name');
        });

        test('removes leading track numbers with period', () => {
            expect(removeTrackNumbers('01. Song Name')).toBe('Song Name');
            expect(removeTrackNumbers('1. Song Name')).toBe('Song Name');
            expect(removeTrackNumbers('12. Song Name')).toBe('Song Name');
        });

        test('removes leading track numbers with dash', () => {
            expect(removeTrackNumbers('01 - Song Name')).toBe('Song Name');
            expect(removeTrackNumbers('1-Song Name')).toBe('Song Name');
            expect(removeTrackNumbers('01-Song Name')).toBe('Song Name');
        });

        test('removes "Track" prefix with numbers', () => {
            expect(removeTrackNumbers('Track 1 - Song Name')).toBe('Song Name');
            expect(removeTrackNumbers('track 01 Song Name')).toBe('Song Name');
            expect(removeTrackNumbers('TRACK 12 - Song Name')).toBe('Song Name');
        });

        test('removes trailing numbers in brackets', () => {
            expect(removeTrackNumbers('Song Name [1]')).toBe('Song Name');
            expect(removeTrackNumbers('Song Name (01)')).toBe('Song Name');
            expect(removeTrackNumbers('Song Name [12]')).toBe('Song Name');
        });

        test('removes trailing numbers with dash', () => {
            expect(removeTrackNumbers('Song Name - 1')).toBe('Song Name');
            expect(removeTrackNumbers('Song Name-01')).toBe('Song Name');
            expect(removeTrackNumbers('Song Name – 12')).toBe('Song Name');
        });

        test('preserves numbers that are part of the song name', () => {
            expect(removeTrackNumbers('24K Magic')).toBe('24K Magic');
            expect(removeTrackNumbers('99 Problems')).toBe('99 Problems');
            expect(removeTrackNumbers('7 Rings')).toBe('7 Rings');
        });

        test('handles empty or null input', () => {
            expect(removeTrackNumbers('')).toBe('');
            expect(removeTrackNumbers(null as any)).toBe(null);
            expect(removeTrackNumbers(undefined as any)).toBe(undefined);
        });
    });

    describe('cleanMetadata', () => {
        test('cleans title with URLs, domains, and track numbers', () => {
            const input = {
                title: '01. Song Name (Kannadamasti.cc)',
                artist: 'Artist Name',
                album: 'Album Name',
            };
            const result = cleanMetadata(input);
            expect(result.title).toBe('Song Name');
            expect(result.artist).toBe('Artist Name');
            expect(result.album).toBe('Album Name');
        });

        test('handles complex metadata cleaning', () => {
            const input = {
                title: 'Track 05 - Awesome Song https://example.com',
                artist: 'Great Artist www.site.com',
                album: '01. Best Album [website.net]',
                genre: 'Pop',
            };
            const result = cleanMetadata(input);
            expect(result.title).toBe('Awesome Song');
            expect(result.artist).toBe('Great Artist');
            expect(result.album).toBe('01. Best Album []');
        });

        test('handles genre as array', () => {
            const input = {
                title: 'Song',
                genre: ['Pop www.site.com', 'Rock example.com'],
            };
            const result = cleanMetadata(input);
            expect(result.genre).toEqual(['Pop', 'Rock']);
        });

        test('filters out empty genres after cleaning', () => {
            const input = {
                title: 'Song',
                genre: ['www.onlyurl.com', 'Rock'],
            };
            const result = cleanMetadata(input);
            expect(result.genre).toEqual(['Rock']);
        });

        test('preserves original object structure', () => {
            const input = {
                title: '01 Song',
                artist: 'Artist',
                year: 2023,
                customField: 'custom value',
            };
            const result = cleanMetadata(input);
            expect(result.year).toBe(2023);
            expect(result.customField).toBe('custom value');
        });
    });
});
