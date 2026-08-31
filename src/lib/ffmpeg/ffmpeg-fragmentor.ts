import FfmpegLib from "@lib/ffmpeg/ffmpeg-lib";
import {IHSLResponse} from "@interfaces/stream";
import {getEnv} from "@utils/index";
import SysLog from "@lib/logger/sys-log";
import ErrorException from "@config/error/error-exception";

export async function fragmentMp4ToFMp4(inputFile: string): Promise<IHSLResponse>
export async function fragmentMp4ToFMp4(inputFile: string, outputDir?: string): Promise<IHSLResponse> {
    if (outputDir) {
        return await new FfmpegLib(inputFile).saveToHLSV2(outputDir);
    }
    try {
        const response = await fetch(getEnv("VIDEO_OPERATOR_API") + "/files/segment", {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({fileName: inputFile}),
        });
        if (!response.ok) {
            throw new ErrorException("API segment", response.status);
        }
        return await response.json();
    } catch (e) {
        SysLog.error("API segment", e);
        throw e;
    }
}
