import path from "path";
import {execSync} from "child_process";
import {isWindowOS} from "@utils/index";
import parseM3u8PlaylistToJSON from "@lib/ffmpeg/m3u8-playlist-parser";
import {IPlaylist} from "@interfaces/stream";
import {IScaleSetting} from "@interfaces/video-config";
import {ScaleSettings} from "@constant/video-config";
import fs from "fs";
import * as process from "node:process";
import StorageEngine from "@services/StorageEngine";
import storageEngine from "@services/StorageEngine";

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

     saveToHLS(outputDir: string): IPlaylist {
        const playlistOutput: string =  storageEngine.joinPath(outputDir ,"/playlist.m3u8");
        const segmentOutput: string= storageEngine.joinPath(outputDir ,"/seg_%d.m4s");
        const initFileName: string = "init.mp4";
        const initOutput: string= storageEngine.joinPath(outputDir , "/", initFileName);

        this.addVideoCodec("libx264")
             .addAudioCodec("aac")
             .addAudioBitRate("128k")
             .addCommand("-map", "0")
             .addCommand("-preset", "veryfast")
             .addCommand("-crf", "23");
        this.commands.push("-f", "hls");
        // this.commands.push("-master_pl_name", "/master.m3u8");
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
        return parseM3u8PlaylistToJSON(playlistOutput, outputDir);
    }

     saveToHLSV2(outputDir: string): IPlaylist {

        this.setupVideoResolutionScaling();
        const writeMasterM3u8File = fs.createWriteStream(storageEngine.joinPath(outputDir ,"/master.m3u8"));
        writeMasterM3u8File.write(`#EXTM3U\n#EXT-X-VERSION:7`);
        let d;

         for (const configResizeOption of this.config_resize_options) {

             const playlistOutput: string =  storageEngine.joinPath(outputDir, "/%v/"+"playlist.m3u8");
             const segmentOutput: string = storageEngine.joinPath(outputDir, "/%v/seg_%d.m4s");
             const masterFile: string = "/master-"+configResizeOption.resize_dir+".m3u8";
             const masterOutput: string = storageEngine.joinPath(outputDir, masterFile);
             const initFileName: string = "init.mp4";
             const initOutput: string = storageEngine.joinPath(outputDir, "/"+configResizeOption.resize_dir+"/", initFileName);

             const newFfmpeg: FfmpegLib = new FfmpegLib(this.input_file)
             .addVideoCodec("h264_nvenc")
             .addAudioCodec("aac")
             .addAudioBitRate("128k")
             // .addCommand("-preset", "veryfast")
             .addCommand("-crf", "23")
             newFfmpeg.addCommand(configResizeOption.key, configResizeOption.value);
             newFfmpeg.addCommand("-map", "v:0");
             newFfmpeg.addCommand("-map", "0:a");
             newFfmpeg.addCommand("-var_stream_map", `\"v:0,a:0,name:${configResizeOption.resize_dir}\"`);
             newFfmpeg.addCommand("-f", "hls");
             newFfmpeg.addCommand("-master_pl_name", masterFile);
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

             const scaleResolutionM4u8String: string = fs.readFileSync(masterOutput).toString().split("\n").filter(Boolean).slice(2).join("\n");
             writeMasterM3u8File.write("\n" + scaleResolutionM4u8String);
             StorageEngine.remove(masterOutput);
             d = parseM3u8PlaylistToJSON(storageEngine.joinPath(outputDir, `/${configResizeOption.resize_dir}/playlist.m3u8`), storageEngine.joinPath(outputDir, `/${configResizeOption.resize_dir}`))
         }
         writeMasterM3u8File.close();
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

    private setupVideoResolutionScaling() {
        const outputSTD: string = execSync("ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 " + this.input_file).toString();
        const [width, height] = outputSTD.split("x").map(Number);
        const newScaleSetting: IScaleSetting[] = ScaleSettings.filter(setting => setting.size <= height);
        this.configResize(newScaleSetting);
    }

    private configResize(scaleSettings: any[]) {
        for (const scaleSetting of scaleSettings) {
            this.config_resize_options.push({key: "-filter:v:0", value: `scale=${scaleSetting.scale.width.toString()}:${scaleSetting.scale.height.toString()} -b:v:0 1500k`, resize_dir: scaleSetting.size + "p"});
        }
    }
}
