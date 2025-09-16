import FfmpegLib from "@lib/ffmpeg/ffmpeg-lib";
import {IHSLResponse} from "@interfaces/stream";

export default async function fragmentMp4ToFMp4(inputFile: string, outputDir: string): Promise<IHSLResponse> {
    return await new FfmpegLib(inputFile).saveToHLSV2(outputDir);
}