import parseM3u8PlaylistToJSON from "@lib/ffmpeg/m3u8-playlist-parser";
import FfmpegLib from "@lib/ffmpeg/ffmpeg-lib";
import {IPlaylist} from "@interfaces/stream";

export default function fragmentMp4ToFMp4(inputFile: string, outputDir: string): IPlaylist {
    const outputs = new FfmpegLib(inputFile)
        .addVideoCodec("libx264")
        .addAudioCodec("aac")
        .addAudioBitRate("128k")
        // .addCommand("-map", "0")
        // .addCommand("-map", "a:0 -c:a:0 aac -b:a:0 96k -ac 2")
        // .addCommand("-map", "-0:s")
        // .addCommand("-map", "-0:d")
        // .addCommand("-map", "0:v:0")
        // .addCommand("-map", "0:a:0")
        .addCommand("-preset", "veryfast")
        .addCommand("-crf", "23")
        .saveToHLS2(outputDir);
    try {
        return outputs;
        // return parseM3u8PlaylistToJSON(outputs.playlistOutput, outputDir);
    } catch (e) {
        console.error("[fragmentMp4ToFMp4]:", e.code, e.message);
        throw e
    }

}