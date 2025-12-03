# Generic Music Site Pattern Matching

## Overview

The metadata cleaner now uses a **generic approach** to detect and remove ANY website or music download source name in brackets, not just a hardcoded list.

## How It Works

### Old Approach (Specific Sites Only):
```typescript
// ❌ Only catches specific sites we list
const MUSIC_SITE_REGEX = /\[(starmusiq|masstamilan|isaimini|...)\]/gi;
```

**Problem:** New sites or unlisted sites won't be caught.

### New Approach (Generic Pattern):
```typescript
// ✅ Catches ANY text in brackets that looks like a website/download source
const MUSIC_SITE_REGEX = /\[([^\]]*(?:\.[a-z]{2,6}|mp3|music|songs?|download|kbps|tamilan|punjabi|hindi|bollywood)[^\]]*)\]/gi;
```

**Benefits:** Catches any music download site, even ones we've never heard of!

## What Gets Removed

The regex matches text in brackets `[...]` that contains:

### 1. Domain Names with TLD
Any text with a domain extension (.com, .in, .xyz, .io, etc.):
- `[Starmusiq.xyz]` ✅
- `[IndiaMusiQ.In]` ✅
- `[PagalWorld.com]` ✅
- `[NewSite.co]` ✅
- `[AnythingSite.net]` ✅

### 2. Music-Related Keywords
Keywords that commonly appear in download source names:
- `[MP3]` ✅
- `[320kbps]` ✅
- `[Music]` ✅
- `[Songs]` ✅ or `[Song]` ✅
- `[Download]` ✅

### 3. Language/Genre Keywords
Common in regional music sites:
- `[Tamilan]` ✅
- `[Punjabi]` ✅
- `[Hindi]` ✅
- `[Bollywood]` ✅

## Examples

### Test Cases:

| Input | Match? | Reason |
|-------|--------|--------|
| `[Starmusiq.xyz]` | ✅ Yes | Contains `.xyz` (TLD) |
| `[IndiaMusiQ.In]` | ✅ Yes | Contains `.In` (TLD) |
| `[PagalWorld]` | ❌ No* | No TLD or keyword |
| `[PagalWorld.com]` | ✅ Yes | Contains `.com` (TLD) |
| `[MP3Download]` | ✅ Yes | Contains "download" keyword |
| `[320kbps]` | ✅ Yes | Contains "kbps" keyword |
| `[TamilSongs]` | ✅ Yes | Contains "songs" keyword |
| `[MrJatt.com]` | ✅ Yes | Contains `.com` (TLD) |
| `[DJMaza]` | ❌ No* | No TLD or keyword |
| `[DJMaza.in]` | ✅ Yes | Contains `.in` (TLD) |
| `[feat. Artist]` | ❌ No | Legitimate bracket usage |
| `[Remix]` | ❌ No | Legitimate bracket usage |

*Note: Some site names without domains might not match, but they're rarely used alone. Sites typically include their domain or music-related keywords.

## Real-World Examples from Research

Based on popular Indian music download sites (2024):

### Official/Legal Sites (with domains):
- `[Saregama.com]` ✅
- `[Gaana.in]` ✅
- `[JioSaavn.com]` ✅
- `[Hungama.net]` ✅

### Unofficial Download Sites (commonly found):
- `[PagalWorld.com]` ✅
- `[Mr-Jatt.in]` ✅
- `[DJMaza.info]` ✅
- `[Songsmp3.com]` ✅
- `[Mp3lio.co]` ✅
- `[Mp3hungama.com]` ✅
- `[Indiamp3.com]` ✅
- `[AtoZmp3.com]` ✅
- `[RaagFm.com]` ✅

### Generic Patterns (also caught):
- `[Download MP3]` ✅
- `[320kbps Music]` ✅
- `[Hindi Songs]` ✅
- `[Bollywood.in]` ✅

## Pattern Breakdown

```typescript
/\[([^\]]*(?:\.[a-z]{2,6}|mp3|music|songs?|download|kbps|tamilan|punjabi|hindi|bollywood)[^\]]*)\]/gi
```

Let's break it down:

1. `\[` - Opening bracket (literal)
2. `([^\]]* ... [^\]]*)` - Capture group for content inside brackets
3. `(?:...)` - Non-capturing group for matching criteria
4. `\.[a-z]{2,6}` - Domain TLD (e.g., .com, .in, .xyz)
   - OR `|`
5. `mp3|music|songs?|download|kbps|tamilan|punjabi|hindi|bollywood` - Keywords
6. `\]` - Closing bracket (literal)
7. `gi` - Global, case-insensitive flags

## Advantages

### ✅ Future-Proof
- Catches new sites automatically
- No need to update the list
- Works with any language/region

### ✅ Comprehensive
- Catches site names with domains
- Catches generic music tags
- Handles variations in naming

### ✅ Safe
- Won't remove legitimate brackets like `[feat. Artist]` or `[Remix]`
- Only matches patterns that look like websites/sources
- Case-insensitive to catch all variations

## Edge Cases

### What Won't Be Removed (By Design):

1. **Simple Tags:**
   - `[Remix]` - No TLD or music keyword
   - `[Live]` - No TLD or music keyword
   - `[Version 2]` - No TLD or music keyword

2. **Legitimate Information:**
   - `[feat. Artist Name]` - No TLD or music keyword
   - `[2024]` - No TLD or music keyword
   - `[Acoustic]` - No TLD or music keyword

### What Will Be Removed:

1. **Website Names:**
   - `[AnySite.com]`
   - `[NewMusicSite.xyz]`
   - `[DownloadHub.in]`

2. **Music Tags:**
   - `[MP3 Download]`
   - `[320kbps Songs]`
   - `[Hindi Music]`

## Testing

### Before Enhancement:
```
Input:  "Song Name [UnknownSite.com]"
Output: "Song Name [UnknownSite.com]"  ❌ Not cleaned
```

### After Enhancement:
```
Input:  "Song Name [UnknownSite.com]"
Output: "Song Name"  ✅ Cleaned!
```

### More Examples:
```
Input:  "Title [NewDownloadSite.xyz]"
Output: "Title"  ✅

Input:  "Title [MP3 320kbps]"
Output: "Title"  ✅

Input:  "Title [Hindi Songs Download]"
Output: "Title"  ✅

Input:  "Title [feat. Artist]"
Output: "Title [feat. Artist]"  ✅ (preserved)
```

## Performance

The generic regex is:
- ✅ Fast (single pass)
- ✅ Efficient (compiled once)
- ✅ Minimal overhead
- ✅ No external dependencies

## Maintenance

This approach requires **minimal maintenance**:

✅ **No need to update** when new music sites emerge
✅ **No need to track** popular download sites
✅ **Automatically handles** regional variations
✅ **Works across** different languages

## Summary

The generic `MUSIC_SITE_REGEX` now intelligently detects and removes:
- ANY website name in brackets (with domain TLD)
- Common music download indicators
- Regional music site patterns
- Quality/format indicators

This makes the metadata cleaner **future-proof** and **comprehensive** without requiring constant updates!
