import fs from "fs";
import path from "path";
import {IPlaylist, ISegmentPlaylist} from "@interfaces/stream";
import SysLog from "@lib/logger/sys-log";
import ErrorException from "@config/error/error-exception";

export default function parseM3u8PlaylistToJSON(m3u8PlaylistFile: string, outputDir: string): Promise<IPlaylist> {
    return new Promise<IPlaylist>((resolve, reject) => {
        try {
            const fileData: string = fs.readFileSync(m3u8PlaylistFile).toString();
            const lines: string[] = fileData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            let duration: number = 0;
            let currentSegment: ISegmentPlaylist = {start: 0, fileName: '', duration: 0};
            const segments: ISegmentPlaylist[] = [];
            let initSegmentUrl: string = '';

            for (const line of lines) {
                if (line.startsWith('#EXT-X-MAP:')) {
                    const match: RegExpMatchArray = /URI="([^"]+)"/.exec(line);
                    if (match) {
                        initSegmentUrl = match[1]; // Adjust path if needed
                    }
                } else if (line.startsWith('#EXTINF:')) {
                    const durationMatch: RegExpMatchArray = /#EXTINF:([\d.]+),/.exec(line);
                    if (durationMatch) {
                        currentSegment.duration = parseFloat(durationMatch[1]);
                    }
                } else if (!line.startsWith('#')) { // It's a segment URL
                    currentSegment.fileName = line; // Adjust path if needed
                    segments.push({...currentSegment}); // Add a copy
                    currentSegment.start += currentSegment.duration;
                } else if (line.startsWith('#EXT-X-ENDLIST')) {
                    duration = currentSegment.start; // Final duration
                }
            }
            fs.writeFileSync(path.join(outputDir, '/playlist.json'), JSON.stringify({initSegmentUrl, segments, duration}));
            resolve({initSegmentUrl, segments, duration});
        } catch (e) {
            SysLog.error("[parseM3u8PlaylistToJSON]", "code:", e.code, " message:", e.message);
            reject(new ErrorException(e.message, e.code));
        }
    })
}