import FfmpegLib from "@lib/ffmpeg/ffmpeg-lib";
import {IPlaylist} from "@interfaces/stream";
import SysLog from "@lib/logger/sys-log";

export default function fragmentMp4ToFMp4(inputFile: string, outputDir: string): IPlaylist {
    try {
        const outputs: IPlaylist = new FfmpegLib(inputFile)
            .saveToHLS(outputDir);
            SysLog.success("[fragmentMp4ToFMp4]:", "video encoding successfully");
            return outputs;
    } catch (e) {
        SysLog.error("[fragmentMp4ToFMp4]:", e.code, e.message);
        throw e
    }
}