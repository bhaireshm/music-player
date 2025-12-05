/**
 * Utility for extracting metadata from filenames
 * Handles common patterns like "Artist - Title", "Title - Artist", etc.
 */

interface ParsedMetadata {
    title?: string;
    artist?: string;
    trackNumber?: number;
}

/**
 * Clean filename by removing extension and common junk
 */
function cleanFilename(filename: string): string {
    // Remove extension
    let name = filename.replace(/\.[^/.]+$/, "");
    // Remove [320kbps], (Official Video), etc.
    name = name.replace(/\[.*?\]|\(.*?\)/g, "").trim();
    // Remove leading/trailing numbers if they look like track numbers (e.g. "01. Song")
    name = name.replace(/^\d+[\.\-\s]+/, "").trim();
    return name;
}

/**
 * Parse filename to extract metadata
 */
export function parseFilename(filename: string): ParsedMetadata {
    const result: ParsedMetadata = {};
    const cleanName = cleanFilename(filename);

    // Pattern 1: Artist - Title (Most common)
    // extended to handle "Artist - Title" and "Artist - Title"
    const hyphenSplit = cleanName.split(/\s+-\s+/);

    if (hyphenSplit.length === 2) {
        // Determine which is artist and which is title
        // Heuristic: Artists usually don't have "feat." or "ft." in the first part, but titles might in the second
        // Also check our existing swap detection logic (we can't import it easily due to circular deps, so simple heuristic here)

        // Assume Artist - Title by default
        result.artist = hyphenSplit[0].trim();
        result.title = hyphenSplit[1].trim();

        // Correction: If 'artist' looks like "Track 01" or similar, it's garbage
        if (/^track\s*\d+$/i.test(result.artist)) {
            result.artist = undefined;
            result.title = result.title; // Keep title part
        }
    } else if (hyphenSplit.length > 2) {
        // Artist - Album - Title or similar
        // Take first as Artist, last as Title
        result.artist = hyphenSplit[0].trim();
        result.title = hyphenSplit[hyphenSplit.length - 1].trim();
    } else {
        // No separator? Use whole filename as title
        result.title = cleanName;
        result.artist = 'Unknown Artist';
    }

    return result;
}
