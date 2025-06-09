const { execSync } = require('child_process');
const fs = require('fs');

// Path to your mp4 file
const VIDEO_PATH = 'video2.mp4';
const OUTPUT_MANIFEST = 'seekable_frame.json';

// Extract keyframe positions using ffprobe
const ffprobeCmd = `ffprobe -v error -select_streams v:0 -show_entries frame=pkt_pts_time,pkt_pos,pkt_size,pict_type -of csv=p=0 "${VIDEO_PATH}"`;
const output = execSync(ffprobeCmd);

const sp_arr = output.toString().split('\n').filter(Boolean);
const output_arr = sp_arr.map(data => {
    data = data.split(",")
    return {startTime: parseFloat(data[0]), startByte: parseInt(data[1]), size: data[2], type: data[3]};
});
// Write to file
fs.writeFileSync(OUTPUT_MANIFEST, JSON.stringify(output_arr, null, 2));
console.log(`✅ Manifest written to ${OUTPUT_MANIFEST}`);
