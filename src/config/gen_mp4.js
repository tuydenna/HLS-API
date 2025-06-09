const fs = require('fs');
const path = require('path');

function parseMp4Dump(dumpText) {
    const lines = dumpText.split('\n'); // Keep newlines for accurate offset calculation

    const manifest = {
        mediaUrl: "your_fragmented_video.mp4", // CHANGE THIS TO YOUR ACTUAL URL
        mimeCodec: "video/mp4; codecs=\"avc1.42E01E,mp4a.40.2\"", // VERIFY THIS WITH ffprobe output for your video
        totalDuration: 0,
        initSegment: { start: 0, end: 0 },
        segments: [] // Media segments
    };

    let currentMediaSegment = null;
    let currentTrackFragmentDetails = {}; // To store sample_count and default_sample_duration for current moof
    let currentMoofStartOffset = null; // Track the start offset of the current moof box

    let presentationTime = 0; // Cumulative presentation time for segments

    // Regex patterns
    const boxRegex = /^\s*\[(\w+)\] size=(\d+)(?:\+(\d+))?(?:,\s*flags=([0-9a-fA-F]+))?\s+offset = (\d+)/;
    const simpleValueRegex = /^\s*(\w[\w\s\/]+)\s*=\s*(.+)$/; // For timescale, duration, etc.


    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        const indentLevel = line.match(/^\s*/)?.[0].length || 0;


        const boxMatch = trimmedLine.match(boxRegex);

        // --- Capture timescales from mvhd and mdhd ---
        // mdhd timescale is more specific to track media, mvhd is global
        if (trimmedLine.includes('[mvhd]')) {
            const nextLines = lines.slice(i + 1);
            const timescaleLine = nextLines.find(l => l.trim().startsWith('timescale = '));
            if (timescaleLine) {
                const match = timescaleLine.match(simpleValueRegex);
                if (match) {
                    // mvhd timescale is a general timescale, useful as a fallback or for overall duration
                    // We'll store it but prioritize mdhd for track-specific calculations
                }
            }
        } else if (trimmedLine.includes('[mdhd]')) {
            const currentTrackIdMatch = lines.slice(0, i + 1).reverse().find(l => l.trim().startsWith('track ID = '));
            let trackId = null;
            if (currentTrackIdMatch) {
                const idMatch = currentTrackIdMatch.match(simpleValueRegex);
                if (idMatch) trackId = parseInt(idMatch[2]);
            }

            const nextLines = lines.slice(i + 1);
            const timescaleLine = nextLines.find(l => l.trim().startsWith('timescale = '));
            if (timescaleLine && trackId !== null) {
                const match = timescaleLine.match(simpleValueRegex);
                if (match) {
                    detectedTimescales[trackId] = parseInt(match[2]);
                }
            }
        }


        if (boxMatch) {
            const boxType = boxMatch[1];
            // mp4dump sometimes reports size=HEADER_SIZE+CONTENT_SIZE, sometimes just total_size=HEADER_SIZE
            // We need to parse total_size consistently.
            let totalBoxSize = parseInt(boxMatch[2]);
            if (boxMatch[3]) { // If content size is present (e.g. size=8+20)
                totalBoxSize = parseInt(boxMatch[2]) + parseInt(boxMatch[3]);
            }
            const offset = parseInt(boxMatch[5]); // Offset is now the 5th group due to optional flags group

            // --- Handle Initialization Segment (ftyp, moov) ---
            if (boxType === 'ftyp' && manifest.initSegment.start === 0 && manifest.initSegment.end === 0) {
                manifest.initSegment.start = offset;
                manifest.initSegment.end = offset + totalBoxSize - 1;
                manifest.initSegment.description = 'File Type Box (ftyp)';
            } else if (boxType === 'moov' && manifest.initSegment.start === 0) { // If moov appears before ftyp (less common but possible)
                manifest.initSegment.start = offset;
                manifest.initSegment.end = offset + totalBoxSize - 1;
                manifest.initSegment.description = 'Movie Box (moov)';
            } else if (boxType === 'moov' && manifest.initSegment.end > 0) { // moov after ftyp
                manifest.initSegment.end = offset + totalBoxSize - 1;
                manifest.initSegment.description = 'Initialization Segment (ftyp + moov)';
            }

            // --- Handle Media Segments (moof, mdat) ---
            else if (boxType === 'moof') {
                // If previous moof didn't get an mdat, something is wrong or dump is incomplete
                if (currentMediaSegment && currentMediaSegment.end === 0) {
                    console.warn(`Warning: Previous moof at offset ${currentMediaSegment.start} did not have an associated mdat. Skipping.`);
                    // Reset to avoid issues with incomplete segments
                    currentMediaSegment = null;
                    currentMoofStartOffset = null;
                    currentTrackFragmentDetails = {};
                }

                currentMoofStartOffset = offset;
                currentMediaSegment = {
                    id: manifest.segments.length + 1,
                    start: offset, // moof's start offset
                    end: 0,        // Will be mdat's end offset
                    duration: 0,   // Calculated later
                    presentationTime: presentationTime
                };
                currentTrackFragmentDetails = {}; // Reset for new moof
            } else if (boxType === 'mdat' && currentMediaSegment && currentMediaSegment.start === (offset - (currentMediaSegment.moof_end - currentMediaSegment.moof_start + 1))) {
                // This mdat immediately follows the current moof
                currentMediaSegment.end = offset + totalBoxSize - 1;

                // Calculate duration
                let calculatedDuration = 0;
                // Find the track with the largest sample count/duration as the primary driver for fragment duration
                let primaryTrackInfo = null;
                let maxSamples = 0;
                for (const trackId in currentTrackFragmentDetails) {
                    const info = currentTrackFragmentDetails[trackId];
                    if (info.sampleCount > maxSamples) { // Simple heuristic for primary track
                        primaryTrackInfo = info;
                        maxSamples = info.sampleCount;
                    }
                }

                if (primaryTrackInfo && primaryTrackInfo.sampleCount > 0 && primaryTrackInfo.defaultSampleDuration > 0) {
                    const timescale = detectedTimescales[primaryTrackInfo.trackId] || (primaryTrackInfo.trackId === 1 ? 60000 : 44100); // Use detected or mdhd default
                    calculatedDuration = (primaryTrackInfo.defaultSampleDuration * primaryTrackInfo.sampleCount) / timescale;
                    currentMediaSegment.duration = parseFloat(calculatedDuration.toFixed(3)); // Round for readability
                } else {
                    console.warn(`Could not precisely determine duration for segment starting at offset ${currentMediaSegment.start}. Setting to 2.0s.`);
                    currentMediaSegment.duration = 2.0; // Default fallback
                }

                manifest.segments.push(currentMediaSegment);
                presentationTime += currentMediaSegment.duration;
                manifest.totalDuration = presentationTime;
                currentMediaSegment = null; // Reset for next segment
                currentMoofStartOffset = null;
            }
        }
        // Capture details within traf/trun *if* we are inside a moof context
        else if (currentMediaSegment) {
            const trackIdMatch = trimmedLine.match(trackIdRegex);
            const sampleCountMatch = trimmedLine.match(sampleCountRegex);
            const sampleDurationMatch = trimmedLine.match(sampleDurationRegex);
            const baseMediaDecodeTimeMatch = trimmedLine.match(/base media decode time = (\d+)/);

            if (trackIdMatch && indentLevel > 0) { // Ensure it's a nested track ID
                const trackId = parseInt(trackIdMatch[1]);
                if (!currentTrackFragmentDetails[trackId]) {
                    currentTrackFragmentDetails[trackId] = {
                        trackId: trackId,
                        sampleCount: 0,
                        defaultSampleDuration: 0,
                        baseMediaDecodeTime: 0 // Optional, for advanced MSE usage
                    };
                }
            } else if (sampleCountMatch && indentLevel > 0) {
                const count = parseInt(sampleCountMatch[1]);
                // Apply to the most recently identified track ID for the current moof
                const lastTrackId = Object.keys(currentTrackFragmentDetails).pop();
                if (lastTrackId) currentTrackFragmentDetails[lastTrackId].sampleCount = count;
            } else if (sampleDurationMatch && indentLevel > 0) {
                const duration = parseInt(sampleDurationMatch[1]);
                const lastTrackId = Object.keys(currentTrackFragmentDetails).pop();
                if (lastTrackId) currentTrackFragmentDetails[lastTrackId].defaultSampleDuration = duration;
            } else if (baseMediaDecodeTimeMatch && indentLevel > 0) {
                const time = parseInt(baseMediaDecodeTimeMatch[1]);
                const lastTrackId = Object.keys(currentTrackFragmentDetails).pop();
                if (lastTrackId) currentTrackFragmentDetails[lastTrackId].baseMediaDecodeTime = time;
            }
        }
    }
    return manifest;
}

// Global variables for detected timescales (for warning messages)
let detectedVideoTimescale = null;
let detectedAudioTimescale = null;

const da = fs.readFileSync(path.join(process.cwd(), "mp4_dump_output.txt"));

const data = parseMp4Dump(da.toString());
console.log(data);