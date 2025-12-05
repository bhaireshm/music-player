import axios from 'axios';

interface MusicBrainzRecording {
    id: string;
    title: string;
    'artist-credit': Array<{
        artist: {
            id: string;
            name: string;
        };
    }>;
    releases?: Array<{
        id: string;
        title: string;
        date?: string;
        country?: string;
    }>;
    tags?: Array<{
        count: number;
        name: string;
    }>;
}

interface EnrichedMetadata {
    title?: string;
    artist?: string;
    album?: string;
    year?: string;
    genres?: string[];
    coverArtUrl?: string;
    mbid?: string; // MusicBrainz ID
}

const USER_AGENT = 'NaadaMusicPlayer/1.0.0 ( bhairesh@mailinator.com )'; // Required by MusicBrainz

/**
 * Search iTunes for song metadata (Fallback/Secondary Source)
 * Often better for cover art and commercial pop/rock metadata
 */
async function searchITunes(title: string, artist: string): Promise<EnrichedMetadata | null> {
    try {
        const query = `${title} ${artist}`;
        // entity=song, limit=1
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;

        const response = await axios.get(url);

        if (!response.data.results || response.data.results.length === 0) {
            return null;
        }

        const match = response.data.results[0];

        // Format high-res artwork (default is 100x100)
        const artwork = match.artworkUrl100
            ? match.artworkUrl100.replace('100x100bb', '600x600bb')
            : null;

        return {
            title: match.trackName,
            artist: match.artistName,
            album: match.collectionName,
            year: match.releaseDate ? match.releaseDate.substring(0, 4) : undefined,
            genres: match.primaryGenreName ? [match.primaryGenreName] : [],
            coverArtUrl: artwork
        };
    } catch (error) {
        console.warn('iTunes search failed:', error);
        return null;
    }
}

/**
 * Search MusicBrainz for song metadata
 */
export async function searchMusicBrainz(title: string, artist: string): Promise<EnrichedMetadata | null> {
    try {
        // 1. Search for the recording
        let query = `recording:"${title}"`;
        if (artist) {
            query += ` AND artist:"${artist}"`;
        }
        const searchUrl = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&fmt=json`;

        const response = await axios.get(searchUrl, {
            headers: { 'User-Agent': USER_AGENT }
        });

        if (!response.data.recordings || response.data.recordings.length === 0) {
            return null;
        }

        // Get the best match (first result)
        const match = response.data.recordings[0] as MusicBrainzRecording;

        const result: EnrichedMetadata = {
            title: match.title,
            artist: match['artist-credit']?.[0]?.artist?.name,
            mbid: match.id,
        };

        // Get Album (Release) info
        if (match.releases && match.releases.length > 0) {
            // Prefer official releases
            const release = match.releases[0];
            result.album = release.title;
            result.year = release.date?.split('-')[0]; // Extract year from YYYY-MM-DD

            // Try to fetch cover art for this release
            try {
                const coverArt = await getCoverArt(release.id);
                if (coverArt) {
                    result.coverArtUrl = coverArt;
                }
            } catch (e) {
                console.warn('Failed to fetch cover art:', e);
            }
        }

        // Get Genres (Tags)
        if (match.tags) {
            // Create a copy before sorting to avoid mutating original array
            result.genres = [...match.tags]
                .sort((a, b) => b.count - a.count) // Sort by popularity
                .slice(0, 5) // Top 5
                .map(t => t.name);
        }

        return result;
    } catch (error) {
        console.error('MusicBrainz search failed:', error);
        return null;
    }
}

/**
 * Unified Metadata Search (Try MusicBrainz, then iTunes, then return best)
 */
export async function enrichMetadata(title: string, artist: string): Promise<EnrichedMetadata | null> {
    // Parallel search for speed? Or sequential for kindness to APIs?
    // Let's try MusicBrainz first (open data), then iTunes (commercial data) if MB fails or for Cover Art

    // We can actually run them in parallel and merge
    const [mbResult, itunesResult] = await Promise.all([
        searchMusicBrainz(title, artist),
        searchITunes(title, artist)
    ]);

    if (!mbResult && !itunesResult) return null;
    if (!mbResult) return itunesResult;
    if (!itunesResult) return mbResult;

    // Merge strategy:
    // - Use Title/Artist/Album from MusicBrainz (usually accurate to standard)
    // - Use Cover Art from iTunes (usually higher res/better guaranteed)
    // - Use Year from either (iTunes usually has reliable release dates)
    // - Merge genres

    return {
        ...mbResult,
        coverArtUrl: itunesResult.coverArtUrl || mbResult.coverArtUrl, // Prefer iTunes art
        year: itunesResult.year || mbResult.year, // Prefer iTunes year (often more precise releasedate)
        genres: [...new Set([...(mbResult.genres || []), ...(itunesResult.genres || [])])].slice(0, 5)
    };
}


/**
 * Fetch cover art from Cover Art Archive
 */
async function getCoverArt(releaseId: string): Promise<string | null> {
    try {
        const url = `https://coverartarchive.org/release/${releaseId}`;
        const response = await axios.get(url);

        if (response.data.images && response.data.images.length > 0) {
            // Return the front cover
            const front = response.data.images.find((img: any) => img.front);
            return front ? front.image : response.data.images[0].image;
        }
        return null;
    } catch (error) {
        // 404 is common if no cover art exists, so we just return null
        return null;
    }
}
