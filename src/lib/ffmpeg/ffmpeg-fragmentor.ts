import parseM3u8PlaylistToJSON from "@lib/ffmpeg/m3u8-playlist-parser";
import FfmpegLib from "@lib/ffmpeg/ffmpeg-lib";

export default function fragmentMp4ToFMp4(inputFile: string, outputDir: string) {
    try {
        const outputs = new FfmpegLib(inputFile)
            .addVideoCodec("libx264")
            .addAudioCodec("aac")
            .addAudioBitRate("128k")
            .addCommand("-map", "0")
            .addCommand("-preset", "veryfast")
            .addCommand("-crf", "23")
            .saveToHLS(outputDir);
        parseM3u8PlaylistToJSON(outputs.playlistOutput, outputDir);
    } catch (e) {
        console.error("[fragmentMp4ToFMp4]:", e.code, e.message);
        throw e
    }

}