import fs from "fs";
import path from "path";

export default function parseM3u8PlaylistToJSON(m3u8PlaylistFile: string, outputDir: string) {
    try {
        const fileData: string = fs.readFileSync(m3u8PlaylistFile).toString();
        const lines = fileData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
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
        fs.writeFileSync(path.join(outputDir,'/playlist.json'), JSON.stringify({ initSegmentUrl, segments, duration }));
        return "success";
    } catch (e) {
        console.error("[parseM3u8PlaylistToJSON]:", "code:", e.code, " message:", e.message);
        throw new Error("M3u8Playlist not found");
    }
}