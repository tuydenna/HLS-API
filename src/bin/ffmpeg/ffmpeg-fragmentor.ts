import parseM3u8PlaylistToJSON from "@bin/ffmpeg/m3u8-playlist-parser";
import FfmpegLib from "@bin/ffmpeg/ffmpeg-lib";

function fragmentMp4ToFMp4(inputFile: string, outputDir: string) {
    // const outDir = path.join(process.cwd(), "../../../storages" + video_path + "/media_segments");
    // const inputFile = path.join(process.cwd(), "../../../storages" + video_path + "/video4.mp4");

    try {
        const outputs = new FfmpegLib(inputFile)
            .addVideoCodec("libx264")
            .addAudioCodec("aac")
            .addAudioBitRate("128k")
            .addCommand("-map", "0")
            .addCommand("-preset", "veryfast")
            .addCommand("-crf", "23")
            .saveToHLS(outDir);
        parseM3u8PlaylistToJSON(outputs.playlistOutput, outDir/segments);
    } catch (e) {
        console.log(e);
        throw e
    }

}