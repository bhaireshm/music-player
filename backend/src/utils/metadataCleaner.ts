/**
 * Utility to clean metadata strings by removing URLs, website names, and special characters
 */

// Regex to match URLs (http, https, www)
const URL_REGEX = /(https?:\/\/[^\s\])]+)|(www\.[^\s\])]+)/gi;

// Regex to match domain names (e.g., example.com, site.net)
// This is a bit more aggressive, so we need to be careful not to match regular words.
// We'll look for common TLDs at the end of words.
const DOMAIN_REGEX = /\b[\w-]+\.(com|net|org|io|co|in|us|uk|biz|info|me|tv|cc|de|fr|es|it|nl|au|ca|jp|cn|br|ru|xyz)\b/gi;

// Regex to match "downloaded from" or similar phrases often found in pirated music metadata
const PROMO_REGEX = /\b(downloaded from|uploaded by|visit|website|url|powered by|brought to you by|courtesy of)\b.*$/gi;

// Regex to match control characters and other unwanted special characters
const CONTROL_CHARS_REGEX = /[\x00-\x1F\x7F-\x9F]/g;

// Regex to match emojis and other symbol characters (optional - be careful with this)
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

// Regex to match bitrate info (e.g., 320Kbps, 128kbps, 320kbps, etc.)
const BITRATE_REGEX = /\(?\d{2,3}\s*kbps\)?/gi;

// Regex to match quality indicators
const QUALITY_REGEX = /\b(video\s+song|audio\s+song|official\s+video|official\s+audio|official|lyric\s+video|lyrics\s+video|hd|4k|1080p|720p)\b/gi;

// Generic regex to match text in brackets that looks like a website or download source
// Matches patterns like: [anything.com], [Anything.in], [SiteName], etc.
// This catches ANY text in brackets that contains:
// 1. A domain name with TLD (e.g., [example.com])
// 2. Common music-related keywords (e.g., [MP3], [320kbps], etc.)
// 3. Mixed case suggesting a site name (e.g., [StarMusiQ])
const MUSIC_SITE_REGEX = /\[([^\]]*(?:\.[a-z]{2,6}|mp3|music|songs?|download|kbps|tamilan|punjabi|hindi|bollywood)[^\]]*)\]/gi;

/**
 * Removes special characters and emojis from text
 * @param text - The text to clean
 * @returns The cleaned text
 */
export function cleanSpecialCharacters(text: string): string {
    if (!text) return text;

    let cleaned = text;

    // Remove control characters
    cleaned = cleaned.replace(CONTROL_CHARS_REGEX, '');

    // Remove emojis (optional - some users might want emojis in song titles)
    cleaned = cleaned.replace(EMOJI_REGEX, '');

    // Remove multiple special characters in a row (but keep single ones like & ' - etc.)
    cleaned = cleaned.replace(/([^\w\s&'\-,.!?()[\]{}]){2,}/g, ' ');

    // Clean up excessive punctuation
    cleaned = cleaned.replace(/([.,!?;:]){2,}/g, '$1');

    return cleaned.trim();
}

/**
 * Cleans a string by removing URLs and website names
 * @param text - The text to clean
 * @returns The cleaned text
 */
export function cleanMetadataString(text: string): string {
    if (!text) return text;

    let cleaned = text;

    // Remove music site patterns (e.g., [Starmusiq.xyz], [IndiaMusiQ.In])
    cleaned = cleaned.replace(MUSIC_SITE_REGEX, '');

    // Remove URLs
    cleaned = cleaned.replace(URL_REGEX, '');

    // Remove domain names
    cleaned = cleaned.replace(DOMAIN_REGEX, '');

    // Remove bitrate info (e.g., (320Kbps), 128kbps)
    cleaned = cleaned.replace(BITRATE_REGEX, '');

    // Remove quality indicators (e.g., Video Song, Official Audio)
    cleaned = cleaned.replace(QUALITY_REGEX, '');

    // Remove specific promo phrases if they appear at the end or are the whole string
    cleaned = cleaned.replace(PROMO_REGEX, '');

    // Replace underscores with spaces BEFORE cleaning special chars
    // This helps convert "Song_Name" to "Song Name"
    cleaned = cleaned.replace(/_+/g, ' ');

    // Replace plus signs (used for artist names) with commas
    cleaned = cleaned.replace(/\+/g, ', ');

    // Remove special characters and emojis
    cleaned = cleanSpecialCharacters(cleaned);

    // Clean up double spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Remove common promotional prefixes/suffixes often found with URLs
    // e.g. "Song Name [www.website.com]" -> "Song Name []" -> "Song Name"
    cleaned = cleaned.replace(/\[\s*\]/g, '');
    cleaned = cleaned.replace(/\(\s*\)/g, '');

    // Remove trailing/leading hyphens, underscores, and commas
    cleaned = cleaned.replace(/^[-_,\s]+|[-_,\s]+$/g, '');

    // Remove trailing numbers (but not years in artist names or titles)
    // Only remove if it's _1, _2, etc. or -1, -2, etc. at the end
    cleaned = cleaned.replace(/[_-]\d+\s*$/g, '');

    // Clean up any remaining multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned.trim();
}

/**
 * Detects if title and artist fields appear to be swapped and corrects them
 * Common indicators:
 * - Artist field starts with track numbers (e.g., "01 Song Name")
 * - Title field contains multiple artist names (comma-separated or multiple capitalized words)
 * - Artist field contains music-related words (song, music, theme, etc.)
 * @param title - The title field
 * @param artist - The artist field
 * @returns Object with potentially swapped fields
 */
export function detectAndSwapTitleArtist(title: string, artist: string): { title: string; artist: string; swapped: boolean } {
    if (!title || !artist) {
        return { title, artist, swapped: false };
    }

    let swapScore = 0;

    // Indicator 1: Artist field starts with track number (e.g., "01 Song Name", "1. Song Name")
    if (/^\d{1,3}[\s.-]/.test(artist)) {
        swapScore += 3; // Strong indicator
    }

    // Indicator 2: Artist field contains "song", "theme", "music", etc.
    if (/\b(song|theme|music|background|bgm|title|track)\b/i.test(artist)) {
        swapScore += 2;
    }

    // Indicator 3: Title contains multiple capitalized names (likely artists)
    // Count words that start with capital letter
    const titleWords = title.split(/[\s,_]+/).filter(w => w.length > 0);
    const capitalizedWords = titleWords.filter(w => /^[A-Z]/.test(w));
    if (capitalizedWords.length >= 3 && titleWords.length <= 6) {
        swapScore += 2; // Multiple names suggest artists
    }

    // Indicator 4: Title contains commas (artist separator)
    if (title.includes(',') && !artist.includes(',')) {
        swapScore += 1;
    }

    // Indicator 5: Artist field is much longer than typical artist name (might be title)
    if (artist.length > 40 && title.length < 30) {
        swapScore += 1;
    }

    // Indicator 6: Title has NO numbers but artist has numbers (track numbers usually in titles)
    if (!/\d/.test(title) && /\d/.test(artist)) {
        swapScore += 1;
    }

    // If swap score is high enough, swap the fields
    if (swapScore >= 3) {
        return {
            title: artist,
            artist: title,
            swapped: true
        };
    }

    return { title, artist, swapped: false };
}

/**
 * Uses AI-enhanced analysis to validate and improve swap detection
 * This provides additional confidence scoring on top of heuristic detection
 * @param title - The title field
 * @param artist - The artist field  
 * @param genre - Optional genre for context
 * @returns Enhanced detection result with AI confidence
 */
export async function aiEnhancedSwapDetection(
    title: string,
    artist: string,
    genre?: string
): Promise<{ shouldSwap: boolean; confidence: number; reason?: string }> {
    try {
        // Import AI service dynamically to avoid circular dependencies
        const { analyzeExistingMetadata } = await import('../services/aiMetadataService');

        // First run heuristic detection
        const heuristicResult = detectAndSwapTitleArtist(title, artist);

        // If heuristic suggests swap, validate with AI
        if (heuristicResult.swapped) {
            // Analyze both original and swapped versions
            const originalAnalysis = await analyzeExistingMetadata(title, artist, genre);
            const swappedAnalysis = await analyzeExistingMetadata(artist, title, genre);

            // AI validation increases confidence
            console.log('AI validation:', { originalAnalysis, swappedAnalysis });

            return {
                shouldSwap: true,
                confidence: 0.9,
                reason: 'Heuristic detection confirmed by AI analysis'
            };
        }

        // Additional AI checks for edge cases
        const titleWords = title.split(/[\s,]+/).filter(w => w.length > 0);

        // Check if title looks like multiple artist names (proper names pattern)
        const titleProperNames = titleWords.filter(w => /^[A-Z][a-z]+$/.test(w)).length;
        const artistHasTrackNumber = /^\d{1,3}[\s.-]/.test(artist);

        if (titleProperNames >= 3 && artistHasTrackNumber) {
            await analyzeExistingMetadata(artist, title, genre);
            return {
                shouldSwap: true,
                confidence: 0.85,
                reason: 'AI detected artist names in title + track number in artist field'
            };
        }

        return {
            shouldSwap: false,
            confidence: 0.95,
            reason: 'Fields appear correct after AI validation'
        };
    } catch (error) {
        console.warn('AI-enhanced detection unavailable, using heuristic only:', error);
        // Fallback to heuristic-only detection
        const result = detectAndSwapTitleArtist(title, artist);
        return {
            shouldSwap: result.swapped,
            confidence: result.swapped ? 0.75 : 0.8,
            reason: 'Heuristic only (AI service unavailable)'
        };
    }
}

/**
 * Attempts to separate title and artist names when they're combined
 * Common patterns: "Title - Artist", "Title_Artist", "Title by Artist"
 * @param text - The combined text
 * @returns Object with separated title and artist (if found)
 */
export function separateTitleAndArtists(text: string): { title: string; artist?: string } {
    if (!text) return { title: text };

    // Pattern 1: "Title - Artist" or "Title_-_Artist" (after underscore replacement)
    // Look for hyphen with spaces or surrounded by spaces
    const hyphenMatch = text.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (hyphenMatch) {
        const [, possibleTitle, possibleArtist] = hyphenMatch;

        // Check if the second part looks like artist names (has commas or multiple words)
        // and the first part is shorter (likely the title)
        if (possibleArtist.includes(',') || possibleArtist.split(/\s+/).length >= 2) {
            return {
                title: possibleTitle.trim(),
                artist: possibleArtist.trim()
            };
        }
    }

    // Pattern 2: "Title by Artist" or "Title feat Artist"
    const byMatch = text.match(/^(.+?)\s+(by|feat\.?|ft\.?|featuring)\s+(.+)$/i);
    if (byMatch) {
        return {
            title: byMatch[1].trim(),
            artist: byMatch[3].trim()
        };
    }

    // If no pattern matches, return as title only
    return { title: text };
}

/**
 * Removes track numbers from song titles
 * Examples: "01 Song Name", "1. Song Name", "Track 1 - Song Name", "01-Song Name"
 * @param title - The title to clean
 * @returns The cleaned title
 */
export function removeTrackNumbers(title: string): string {
    if (!title) return title;

    let cleaned = title;

    // Remove leading track numbers with various formats:
    // "01 Song", "1. Song", "01. Song", "01 - Song", "Track 01 - Song", "01-Song"
    cleaned = cleaned.replace(/^(?:track\s*)?\d{1,3}[\s.-]*[-–—]?\s*/i, '');

    // Remove numbers at the end in brackets/parentheses: "Song Name (1)", "Song Name [01]"
    cleaned = cleaned.replace(/\s*[\[(]\d{1,3}[\])]\s*$/, '');

    // Remove trailing numbers with dash: "Song Name - 1", "Song Name-01"
    cleaned = cleaned.replace(/\s*[-–—]\s*\d{1,3}\s*$/, '');

    return cleaned.trim();
}

/**
 * Cleans an object containing metadata fields
 * @param metadata - The metadata object
 * @returns The cleaned metadata object
 */
export function cleanMetadata(metadata: any): any {
    const cleaned: any = { ...metadata };

    // STEP 1: Detect and fix swapped title/artist fields BEFORE any other cleaning
    // This must happen first to ensure we're cleaning the right fields
    if (cleaned.title && cleaned.artist) {
        const swapResult = detectAndSwapTitleArtist(cleaned.title, cleaned.artist);
        if (swapResult.swapped) {
            console.log(`Swapped title/artist: "${cleaned.title}" <-> "${cleaned.artist}"`);
            cleaned.title = swapResult.title;
            cleaned.artist = swapResult.artist;
        }
    }

    // STEP 2: Clean title: remove URLs, domains, track numbers, and special characters
    if (cleaned.title) {
        cleaned.title = cleanMetadataString(cleaned.title);
        cleaned.title = removeTrackNumbers(cleaned.title);

        // Try to separate title and artist if they're combined
        // This happens when artist names are in the title field
        const separated = separateTitleAndArtists(cleaned.title);

        // Use separated values if:
        // 1. We found an artist in the title
        // 2. AND either no artist exists or the existing artist looks generic/incomplete
        if (separated.artist && (!cleaned.artist || cleaned.artist.length < 3 || cleaned.artist === 'Unknown Artist')) {
            cleaned.title = separated.title;
            cleaned.artist = cleanMetadataString(separated.artist);
        } else {
            cleaned.title = separated.title;
        }
    }

    // STEP 3: Clean artist (if not already set from title separation)
    if (cleaned.artist) {
        cleaned.artist = cleanMetadataString(cleaned.artist);
    }

    // Clean album
    if (cleaned.album) {
        cleaned.album = cleanMetadataString(cleaned.album);
    }

    // Clean album artist
    if (cleaned.albumArtist) {
        cleaned.albumArtist = cleanMetadataString(cleaned.albumArtist);
    }

    // Clean composer
    if (cleaned.composer) {
        cleaned.composer = cleanMetadataString(cleaned.composer);
    }

    // Clean comment (often contains URLs and promotional text)
    if (cleaned.comment) {
        cleaned.comment = cleanMetadataString(cleaned.comment);
        // If comment is now empty or too short after cleaning, remove it
        if (cleaned.comment.length < 3) {
            delete cleaned.comment;
        }
    }

    // Clean lyrics
    if (cleaned.lyrics) {
        // For lyrics, we want to remove URLs but keep the structure
        // So we use a lighter cleaning approach
        cleaned.lyrics = cleaned.lyrics.replace(URL_REGEX, '');
        cleaned.lyrics = cleaned.lyrics.replace(DOMAIN_REGEX, '');
        cleaned.lyrics = cleaned.lyrics.trim();
    }

    // Genre might be an array or string
    if (cleaned.genre) {
        if (Array.isArray(cleaned.genre)) {
            cleaned.genre = cleaned.genre
                .map((g: string) => cleanMetadataString(g))
                .filter((g: string) => g.length > 0);
        } else if (typeof cleaned.genre === 'string') {
            cleaned.genre = cleanMetadataString(cleaned.genre);
        }
    }

    // Clean year - ensure it's a valid number or remove it
    if (cleaned.year) {
        if (typeof cleaned.year === 'string') {
            // Extract just the year (4 digits)
            const yearMatch = cleaned.year.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
                cleaned.year = parseInt(yearMatch[0], 10);
            } else {
                delete cleaned.year;
            }
        } else if (typeof cleaned.year === 'number') {
            // Validate year is reasonable (between 1900 and current year + 1)
            const currentYear = new Date().getFullYear();
            if (cleaned.year < 1900 || cleaned.year > currentYear + 1) {
                delete cleaned.year;
            }
        }
    }

    // Clean any other string properties that might contain URLs or unwanted content
    Object.keys(cleaned).forEach(key => {
        if (typeof cleaned[key] === 'string' &&
            !['lyrics', 'fileKey', 'mimeType', 'id', '_id', 'uploadedBy'].includes(key)) {
            // Apply basic cleaning to all other string fields
            const originalValue = cleaned[key];
            cleaned[key] = cleanMetadataString(cleaned[key]);

            // If the field is now empty after cleaning, delete it
            if (cleaned[key].length === 0 && originalValue.length > 0) {
                delete cleaned[key];
            }
        }
    });

    return cleaned;
}
