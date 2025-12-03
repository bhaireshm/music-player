# Enhanced Metadata Cleaning - Examples and Results

## Problem Statement
Song metadata from downloaded sources often contains:
- Website names in brackets (e.g., `[Starmusiq.xyz]`)
- Bitrate information (e.g., `(320Kbps)`)
- Quality indicators (e.g., `Video Song`, `Official Audio`)
- Underscores instead of spaces
- Plus signs between artist names
- Artist names mixed with song titles
- Trailing numbers and junk text

## Solution Implemented

### New Features Added

1. **Music Site Pattern Removal**
   - Removes website names in brackets: `[Starmusiq.xyz]`, `[IndiaMusiQ.In]`, etc.

2. **Bitrate Info Removal**
   - Removes quality indicators: `(320Kbps)`, `128kbps`, etc.

3. **Quality Indicator Removal**
   - Removes: `Video Song`, `Official Audio`, `Lyric Video`, `HD`, `4K`, etc.

4. **Underscore and Plus Sign Handling**
   - Converts underscores to spaces: `Song_Name` → `Song Name`
   - Converts plus signs to commas: `Artist1+Artist2` → `Artist1, Artist2`

5. **Title-Artist Separation**
   - Detects patterns like `Title - Artist` or `Title feat Artist`
   - Automatically separates them into proper fields

6. **Trailing Junk Removal**
   - Removes trailing numbers: `Song_2` → `Song`
   - Removes leading/trailing separators

## Real-World Examples from User

### Example 1: Website Name in Brackets
**Input:** `Adadaa Ithuyenna [Starmusiq.xyz]`

**Processing:**
- Remove music site pattern: `Adadaa Ithuyenna`
- Clean metadata string: `Adadaa Ithuyenna`

**Output:**
- Title: `Adadaa Ithuyenna`
- Artist: N/A (would be set from file metadata or "Unknown Artist")

---

### Example 2: Artist Names with Plus Signs
**Input:** `Aathi Vishal+Dadlani,+Anirudh+Ravichander`

**Processing:**
- Convert plus signs to commas: `Aathi Vishal, Dadlani, , Anirudh, Ravichander`
- Clean up double commas and spaces: `Aathi Vishal, Dadlani, Anirudh, Ravichander`

**Output:**
- Title: `Aathi Vishal, Dadlani, Anirudh, Ravichander`
- This looks like artist names, would likely be detected as such

---

### Example 3: Title and Artists Separated by Underscore-Hyphen
**Input:** `Yeno Yeno Panithuli_-Shail Hada_Sudha Raghunathan_Andrea`

**Processing:**
- Convert underscores to spaces: `Yeno Yeno Panithuli - Shail Hada Sudha Raghunathan Andrea`
- Detect pattern `Title - Artist`: Match found!
- Split on hyphen

**Output:**
- Title: `Yeno Yeno Panithuli`
- Artist: `Shail Hada, Sudha Raghunathan, Andrea`

---

### Example 4: Only Artist Names with Underscores
**Input:** `_Anirudh_Nadisha_Thomas_Maalavika_Manoj`

**Processing:**
- Convert underscores to spaces: `Anirudh Nadisha Thomas Maalavika Manoj`
- Remove leading/trailing spaces
- Clean metadata string: `Anirudh Nadisha Thomas Maalavika Manoj`

**Output:**
- Title: `Anirudh Nadisha Thomas Maalavika Manoj`
- Note: This is all artist names, but without a clear separator pattern, it remains as title
- User would need to manually edit or provide proper artist field

---

### Example 5: Movie Name and Trailing Number
**Input:** `Hatavadi - Kannada movie_2`

**Processing:**
- Convert underscores to spaces: `Hatavadi - Kannada movie 2`
- Remove trailing numbers: `Hatavadi - Kannada movie`
- Detect pattern `Title - Artist`: Match found!

**Output:**
- Title: `Hatavadi`
- Artist: `Kannada movie` (not ideal, but better than before)

---

### Example 6: Bitrate Info in Parentheses
**Input:** `Baaluvantha Hoove (320Kbps)`

**Processing:**
- Remove bitrate info: `Baaluvantha Hoove`
- Clean empty parentheses: `Baaluvantha Hoove`

**Output:**
- Title: `Baaluvantha Hoove`
- Artist: N/A (would be set from file metadata)

---

### Example 7: Video Song Tag and Multiple Artists
**Input:** `Soul Of Dia (Video Song) _ Sanjith Hegde, Chinmayi Sripaada _ B. Ajaneesh Loknath _ KS Ashoka`

**Processing:**
- Convert underscores to spaces: `Soul Of Dia (Video Song)   Sanjith Hegde, Chinmayi Sripaada   B. Ajaneesh Loknath   KS Ashoka`
- Remove quality indicators: `Soul Of Dia   Sanjith Hegde, Chinmayi Sripaada   B. Ajaneesh Loknath   KS Ashoka`
- Remove empty parentheses
- Detect pattern with commas (artist names): Match found!

**Output:**
- Title: `Soul Of Dia`
- Artist: `Sanjith Hegde, Chinmayi Sripaada, B. Ajaneesh Loknath, KS Ashoka`

---

### Example 8: Website Domain and Trailing Underscore
**Input:** `Ideera-IndiaMusiQ.In_`

**Processing:**
- Convert underscores to spaces: `Ideera-IndiaMusiQ.In `
- Remove domain names: `Ideera- `
- Remove trailing separators: `Ideera`

**Output:**
- Title: `Ideera`
- Artist: N/A

---

## Standard Song Title Format

The metadata cleaner now enforces a standard format:

### Title Field:
- Remove all website references
- Remove bitrate and quality info
- Remove track numbers
- Convert underscores to spaces
- Clean special characters
- Trim leading/trailing junk

### Artist Field:
- Extract from title if title contains patterns like "Title - Artist"
- Convert plus signs to commas for multiple artists
- Convert underscores to spaces
- Clean special characters
- Proper comma-separated format for multiple artists

### Example of Ideal Output Format:

**Before (Raw Metadata):**
```
Title: "Yeno Yeno Panithuli_-Shail Hada_Sudha Raghunathan_Andrea [Starmusiq.xyz] (320Kbps)"
Artist: ""
```

**After (Cleaned Metadata):**
```
Title: "Yeno Yeno Panithuli"
Artist: "Shail Hada, Sudha Raghunathan, Andrea"
```

## Implementation Details

### Files Modified:
- `backend/src/utils/metadataCleaner.ts`

### New Regular Expressions:
```typescript
// Music download sites
MUSIC_SITE_REGEX = /\[(starmusiq|masstamilan|isaimini|...)\]/gi

// Bitrate info
BITRATE_REGEX = /\(?\d{2,3}\s*kbps\)?/gi

// Quality indicators
QUALITY_REGEX = /\b(video\s+song|official\s+audio|...)\b/gi
```

### New Functions:
```typescript
separateTitleAndArtists(text: string): { title: string; artist?: string }
```

### Enhanced Functions:
- `cleanMetadataString()` - Now handles all new patterns
- `cleanMetadata()` - Intelligently separates title and artist

## Testing Recommendations

1. **Upload test songs** with the problematic metadata examples
2. **Verify** that titles and artists are properly separated
3. **Check** that junk text is removed
4. **Ensure** that valid metadata is preserved

## Notes

- The metadata cleaner is conservative and won't separate title/artist if a valid artist already exists
- Some edge cases may still require manual editing (this is expected)
- The parser prioritizes not losing information over perfect separation
- User can always manually edit metadata in the Edit Song modal
