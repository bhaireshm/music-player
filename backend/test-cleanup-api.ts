/**
 * Test script for metadata cleanup API
 * Run with: npx tsx test-cleanup-api.ts
 */

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_MODE = true; // Set to false to run on ALL songs

// You'll need to get your auth token from the browser
// 1. Open your app in browser
// 2. Open DevTools > Application > Local Storage
// 3. Copy the 'token' value
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'YOUR_TOKEN_HERE';

interface CleanupResult {
    id: string;
    title: string;
    status: 'success' | 'skipped' | 'failed';
    changes?: string[];
    error?: string;
}

interface BatchResponse {
    message: string;
    total: number;
    processed: number;
    skipped: number;
    failed: number;
    results: CleanupResult[];
}

async function testSingleSongCleanup(songId: string) {
    console.log(`\n🧪 Testing single song cleanup for ID: ${songId}`);
    console.log('='.repeat(80));

    try {
        const response = await fetch(`${API_BASE_URL}/songs/${songId}/cleanup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ API Error:', error);
            return;
        }

        const result = await response.json();

        console.log('\n✅ Cleanup completed!');
        console.log('Message:', result.message);

        if (result.changes && result.changes.length > 0) {
            console.log('\n📝 Changes made:');
            result.changes.forEach((change: string, i: number) => {
                console.log(`   ${i + 1}. ${change}`);
            });
        } else {
            console.log('\n✓ No changes needed - metadata was already clean');
        }

        console.log('\n📊 Updated song:');
        console.log(`   Title: ${result.song.title}`);
        console.log(`   Artist: ${result.song.artist}`);
        console.log(`   Album: ${result.song.album || 'N/A'}`);

    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

async function testBatchCleanup(processAll: boolean = false, songIds?: string[]) {
    console.log(`\n🧪 Testing batch cleanup (processAll: ${processAll})`);
    console.log('='.repeat(80));

    const body = processAll ? { processAll: true } : { songIds };

    try {
        const response = await fetch(`${API_BASE_URL}/songs/batch-cleanup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ API Error:', error);
            return;
        }

        const result: BatchResponse = await response.json();

        console.log('\n✅ Batch cleanup completed!');
        console.log('='.repeat(80));
        console.log(`📊 Summary:`);
        console.log(`   Total songs: ${result.total}`);
        console.log(`   ✅ Processed: ${result.processed}`);
        console.log(`   ⏭️  Skipped: ${result.skipped}`);
        console.log(`   ❌ Failed: ${result.failed}`);

        if (result.processed > 0) {
            console.log('\n📝 Songs that were cleaned:');
            console.log('='.repeat(80));

            result.results
                .filter(r => r.status === 'success')
                .forEach((song, i) => {
                    console.log(`\n${i + 1}. ${song.title} (ID: ${song.id})`);
                    if (song.changes) {
                        song.changes.forEach(change => {
                            console.log(`   ✓ ${change}`);
                        });
                    }
                });
        }

        if (result.failed > 0) {
            console.log('\n❌ Failed songs:');
            console.log('='.repeat(80));

            result.results
                .filter(r => r.status === 'failed')
                .forEach((song, i) => {
                    console.log(`\n${i + 1}. ${song.title} (ID: ${song.id})`);
                    console.log(`   Error: ${song.error}`);
                });
        }

        // Save detailed results to file
        const fs = require('fs');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `cleanup-results-${timestamp}.json`;
        fs.writeFileSync(filename, JSON.stringify(result, null, 2));
        console.log(`\n💾 Detailed results saved to: ${filename}`);

        return result;

    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

async function getAllSongs() {
    console.log('\n🔍 Fetching all songs...');

    try {
        const response = await fetch(`${API_BASE_URL}/songs`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch songs');
        }

        const data = await response.json();
        return data.songs || [];
    } catch (error) {
        console.error('❌ Failed to fetch songs:', error);
        return [];
    }
}

async function main() {
    console.log('\n🎵 Metadata Cleanup API Test');
    console.log('='.repeat(80));

    if (AUTH_TOKEN === 'YOUR_TOKEN_HERE') {
        console.error('\n❌ ERROR: Please set your AUTH_TOKEN!');
        console.log('\nHow to get your token:');
        console.log('1. Open your app in the browser');
        console.log('2. Open DevTools (F12)');
        console.log('3. Go to Application > Local Storage');
        console.log('4. Copy the "token" value');
        console.log('5. Set it as environment variable: AUTH_TOKEN=your_token npx tsx test-cleanup-api.ts');
        return;
    }

    // Test 1: Get all songs to find problematic ones
    const songs = await getAllSongs();
    console.log(`\n✅ Found ${songs.length} songs`);

    if (songs.length === 0) {
        console.log('\n⚠️  No songs found. Upload some songs first!');
        return;
    }

    // Find songs with problematic metadata
    const problematicSongs = songs.filter((song: any) => {
        return (
            song.title?.includes('[') ||
            song.title?.includes('_') ||
            song.artist?.match(/^\d{1,3}[\s.-]/) ||  // Artist starts with track number
            song.title?.match(/^\d{1,3}[\s.-]/)  // Title starts with track number (might be swapped)
        );
    });

    console.log(`\n🔍 Found ${problematicSongs.length} songs with potential issues:`);
    problematicSongs.slice(0, 5).forEach((song: any, i: number) => {
        console.log(`   ${i + 1}. "${song.title}" - ${song.artist}`);
    });

    if (problematicSongs.length > 5) {
        console.log(`   ... and ${problematicSongs.length - 5} more`);
    }

    if (TEST_MODE) {
        console.log('\n🧪 TEST MODE: Running on first problematic song only');

        if (problematicSongs.length > 0) {
            await testSingleSongCleanup(problematicSongs[0].id);
        }

        console.log('\n💡 To run on ALL songs, set TEST_MODE = false in the script');
    } else {
        console.log('\n🚀 LIVE MODE: Processing all songs...');
        await testBatchCleanup(true);
    }

    console.log('\n✅ Test completed!');
}

// Run the tests
main().catch(console.error);
