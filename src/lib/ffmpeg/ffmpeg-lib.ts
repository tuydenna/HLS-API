import path from "path";
import {execSync} from "child_process";
import {isWindowOS} from "@utils/index";
import parseM3u8PlaylistToJSON from "@lib/ffmpeg/m3u8-playlist-parser";
import {IPlaylist} from "@interfaces/stream";

export default class FfmpegLib {
    private commands: string[] = ["ffmpeg -i"];
    private input_file: string = "";

    private config_resize_options: Array<{key: string, value: string, resize_dir: string}> = []

    constructor(inputFile: string) {
        console.log("FfmpegLib", inputFile);
        this.commands.push(inputFile);
        this.input_file = inputFile;
    }

    addCommand(setter: string, value: string = "") {
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

     saveToHLS(outputDir: string) {
        const playlistOutput: string =  path.join(outputDir ,"/playlist.m3u8");
        const segmentOutput: string= path.join(outputDir ,"/seg_%d.m4s");
        const initFileName: string = "init.mp4";
        const initOutput: string= path.join(outputDir , "/", initFileName);
        this.commands.push("-f", "hls");
        this.commands.push("-master_pl_name", "/master.m3u8");
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

     saveToHLS2(outputDir: string): IPlaylist {
        this.configResize360p();
        this.configResize720p();
        this.configResize1280p();
        let d;

         for (const configResizeOption of this.config_resize_options) {

             const playlistOutput: string =  path.join(outputDir, "/%v/playlist.m3u8");
             const segmentOutput: string = path.join(outputDir, "/%v/seg_%d.m4s");
             const masterOutput: string = "/master.m3u8";
             const initFileName: string = "init.mp4";
             const initOutput: string = path.join(outputDir, "/"+configResizeOption.resize_dir+"/", initFileName);

             const newFfmpeg: FfmpegLib = new FfmpegLib(this.input_file);

             newFfmpeg.addCommand(configResizeOption.key, configResizeOption.value);
             newFfmpeg.addCommand("-map", "v:0");
             newFfmpeg.addCommand("-map", "0:a");
             newFfmpeg.addCommand("-var_stream_map", `\"v:0,a:0,name:${configResizeOption.resize_dir}\"`);
             newFfmpeg.addCommand("-f", "hls");
             newFfmpeg.addCommand("-master_pl_name", masterOutput);
             newFfmpeg.addCommand("-hls_time", "6");
             newFfmpeg.addCommand("-hls_playlist_type", "vod");
             newFfmpeg.addCommand("-hls_segment_type ", "fmp4");
             newFfmpeg.addCommand("-hls_flags", "independent_segments");
             newFfmpeg.addCommand("-hls_segment_filename ", segmentOutput);

             // OS Config
             if (isWindowOS()) {
                 newFfmpeg.addCommand("-hls_fmp4_init_filename", initOutput);
             } else {
                 newFfmpeg.addCommand("-hls_fmp4_init_filename", initFileName);
             }
             newFfmpeg.addCommand(playlistOutput);
             newFfmpeg.save();
             console.log({playlistOutput, segmentOutput, initOutput})
             d = parseM3u8PlaylistToJSON(path.join(outputDir, `/${configResizeOption.resize_dir}/playlist.m3u8`), path.join(outputDir, `/${configResizeOption.resize_dir}`))
         }

         return d;
     }

    private save() {
        try {
            const command: string = this.commands.join(" ");
            execSync(command, { stdio: "inherit" });
            return "success";
        } catch (error) {
            console.error(error);
            return "error";
        }
    }

    private configResize360p() {
        this.config_resize_options.push({key: "-filter:v:0", value: "scale=640:360 -c:v:0 libx264 -b:v:0 1500k", resize_dir: "360p"});
    }

    private configResize720p() {
        this.config_resize_options.push({key: "-filter:v:0", value: "scale=1280:720 -c:v:0 libx264 -b:v:0 1500k", resize_dir: "720p"});
    }

    private configResize1280p() {
        this.config_resize_options.push({key: "-filter:v:0", value: "scale=1920:1080 -c:v:0 libx264 -b:v:0 3000k", resize_dir: "1280p"});
    }
}
