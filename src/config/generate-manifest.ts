import path from "path";

const { execSync } = require('child_process');
const fs = require('fs');

// Path to your mp4 file
const VIDEO_PATH = 'input.mp4';
const OUTPUT_MANIFEST = 'manifest.json';

const dir = path.join(__dirname, './storage/videos/7c07b46b-b5eb-4152-9443-a98947348069.mp4');
console.log(dir);
// Extract keyframe positions using ffprobe
const ffprobeCmd = `ffprobe -v error -select_streams v:0 -show_frames -show_entries frame=key_frame,pkt_pos -of csv=p=0 "${dir}"`;
const output = execSync(ffprobeCmd).toString();

const lines = output.trim().split('\n');
const keyframes = lines
    .map(line => {
        const [keyFrame, pktPos] = line.split(',');
        return keyFrame.trim() === '1' ? parseInt(pktPos.trim(), 10) : null;
    })
    .filter(pos => pos !== null);

// Estimate init segment size (simplified)
const initEnd = keyframes[0] - 1;

// Build manifest
const manifest = [];

// Init segment
manifest.push({ start: 0, end: initEnd, type: 'init' });

// Media segments
for (let i = 0; i < keyframes.length; i++) {
    const start = keyframes[i];
    const end = i < keyframes.length - 1 ? keyframes[i + 1] - 1 : null; // last segment reads to EOF
    manifest.push({ start, end, type: 'media' });
}

// Write to file
fs.writeFileSync(OUTPUT_MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`✅ Manifest written to ${OUTPUT_MANIFEST}`);
