import path from "path";
import {execSync} from "child_process";
import {isWindowOS} from "@utils/index";

export default class FfmpegLib {
    private commands: string[] = ["ffmpeg -i"]

    constructor(inputFile: string) {
        this.commands.push(inputFile);
    }

    addCommand(setter: string, value: string) {
        this.commands.push(setter, value);
        return this;
    }

    addVideoCodec(value: string) {
        this.commands.push("-c:v", value);
        return this;
    }

    addAudioCodec(value: string) {
        this.commands.push("-c:a", value);
        return this;
    }

    addAudioBitRate(value: string) {
        this.commands.push("-b:a", value);
        return this;
    }

    save() {
        try {
            const command: string = this.commands.join(" ");
            console.log("start fragmenting file", command);
            execSync(command, { stdio: "inherit" });
            return "success";
        } catch (error) {
            console.error(error);
            return "error";
        }
    }

     saveToHLS(outputDir: string) {
        const playlistOutput: string =  path.join(outputDir ,"/playlist.m3u8");
        const segmentOutput: string= path.join(outputDir ,"/seg_%d.m4s");
        const initFileName: string = "init.mp4";
        const initOutput: string= path.join(outputDir , "/", initFileName);

        this.commands.push("-f", "hls");
        this.commands.push("-hls_time", "6");
        this.commands.push("-hls_playlist_type", "vod");
        this.commands.push("-hls_segment_type ", "fmp4");
        this.commands.push("-hls_flags", "independent_segments");
        this.commands.push("-hls_segment_filename ", segmentOutput);

        // OS Config
         if (isWindowOS()) {
             this.commands.push("-hls_fmp4_init_filename", initOutput);
         } else {
             this.commands.push("-hls_fmp4_init_filename", initFileName);
         }
        this.commands.push(playlistOutput);
        this.save();
        return {playlistOutput, segmentOutput, initOutput};
    }
}
