const fs = require("fs");
const path = require("path");

function parseM3U8(manifestText) {
    const lines = manifestText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let duration = 0;
    let currentSegment = { start: 0, url: '' };
    const segments = [];
    let initSegmentUrl = '';

    for (const line of lines) {
        if (line.startsWith('#EXT-X-MAP:')) {
            const match = /URI="([^"]+)"/.exec(line);
            if (match) {
                initSegmentUrl = `media_segments/${match[1]}`; // Adjust path if needed
            }
        } else if (line.startsWith('#EXTINF:')) {
            const durationMatch = /#EXTINF:([\d.]+),/.exec(line);
            if (durationMatch) {
                currentSegment.duration = parseFloat(durationMatch[1]);
            }
        } else if (!line.startsWith('#')) { // It's a segment URL
            currentSegment.url = `media_segments/${line}`; // Adjust path if needed
            segments.push({ ...currentSegment }); // Add a copy
            currentSegment.start += currentSegment.duration;
        } else if (line.startsWith('#EXT-X-ENDLIST')) {
            duration = currentSegment.start; // Final duration
        }
    }
    return { initSegmentUrl, segments, duration };
}

const data = fs.readFileSync(path.join(process.cwd(),'playlist.m3u8'));

const json = parseM3U8(data.toString());

console.log(json);

fs.writeFileSync(path.join(process.cwd(),'playlist.json'), JSON.stringify(json));