import {Get, Param, Prefix, Query, Req, Res} from "express-router-controller-khmer";
import fs, {ReadStream} from "fs";
import {getStorageLink} from "@constant/path";
import {Request, Response} from "express"
import FileService from "@services/FileService";
import {File} from "@prisma/client"
import {IPlaylist, ISegmentPlaylist} from "@interfaces/stream";
import {
	formatMasterM3u8APIEndPoint,
	formatPlaylistM3u8APIEndPoint
} from "../helper/stream-helper";
import {getEnv} from "@utils/index";
import sysLog from "@lib/logger/sys-log";
import SysLog from "@lib/logger/sys-log";
import ErrorException from "@config/error/error-exception";

@Prefix('/api/v2/streams/fmp4')
export default class StreamController {

	@Get('/:fileId/playlist')
	async getPlaylistFile(@Query("scale") scale: string, @Req() req: Request, @Res() res: Response) {
		try {
			const video: File | null = await new FileService().getOne(req.params.fileId);
			const playListFileName: string = scale ? "playlist.m3u8" : "master.m3u8";

			if (!video) {
				console.log("\"File not found!\"");
				throw Error("File not found!")
			}
			const api: string = getEnv("STREAM_ENDPOINT_V2") + "/"+video.id+"/";

			const playlistFile: string = (scale ? scale + "/" : "" ) + playListFileName;
			const videoPath: string = getStorageLink(`${video.dirPath}/${playlistFile}`) ;
			const videoSize: number = fs.statSync(videoPath).size;

			console.log("STREAM_ENDPOINT_V2", videoPath);
			SysLog.error("playListFileName", playListFileName, videoPath);

			if (!playlistFile){
				return res.status(400).send("Segment File is required!")
			}

			let playlist: Buffer = fs.readFileSync(videoPath);

			if (scale) {
				playlist = formatPlaylistM3u8APIEndPoint(playlist, api, scale);
			} else {
				playlist = formatMasterM3u8APIEndPoint(playlist, api + "playlist");
			}

			res.setHeader("Content-Length", videoSize);
			res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
			// this.setCacheControl(res)

			res.send(playlist);

		} catch (e) {
			console.error(e);
			if (e.code === "ENOENT") {
				return res.status(404).json({message: "segment not found!"})
			}
			return res.status(500).json({message: "error: "+e.message})
		}
	}

	@Get('/:fileId/:segmentFile')
	async streamSegmentFile(@Param("segmentFile") segmentFile: string, @Req() req: Request, @Res() res: Response) {
		let segmentChunk: ReadStream;
		try {
			const video: File | null = await new FileService().getOne(req.params.fileId);
			if (!video) {
				throw Error("File not found!")
			}

			const videoPath: string = getStorageLink(video.dirPath + "/" + req.query.scale + "/" + segmentFile) ;
			const videoSize: number = fs.statSync(videoPath).size;
			segmentChunk = fs.createReadStream(videoPath);

			if (!segmentFile){
				return res.status(400).send("Segment File is required!")
			}

			const headers = {
				"X-Segment-Name":  segmentFile,
				"Access-Control-Expose-Headers": "X-Segment-Name",
				"Content-Length": videoSize,
				"Content-Type": "video/mp4",
			}

			// this.setCacheControl(res);
			res.writeHead(200, headers);
			segmentChunk.pipe(res);

			req.on("aborted", function() {
				sysLog.error("[Aborting segment]", segmentFile)
				segmentChunk.destroy()
				res.end();
			})

			segmentChunk.on('error', (err: Error) => {
				sysLog.error("[Stream segment]", "fail reading segment chunk", err)
				segmentChunk.destroy();
				res.end();
			});

		} catch (e) {
			SysLog.error("[streamSegmentFile]", e);
			if (e.code === "ENOENT") {
				return res.status(ErrorException.END_STREAM_CODE).json({message: "Stream segment file is ended !"})
			}
			segmentChunk.destroy();
			return res.status(500).json({message: "error: "+e.message})
		}
	}

	@Get('/seeks/:fileId/:currentTime')
	async streamSeekingSegmentFile(@Param("fileId") fileId: string, @Param("currentTime") currentTimeP: string, @Query("scale") scale: string, @Req() req: Request, @Res() res: Response) {
		try {
			const video: File | null = await new FileService().getOne(fileId);

			if (!video) {
				throw Error("File not found!")
			}

			const playlistPath: string = getStorageLink(video.dirPath, `/${scale}/playlist.json`);
			const currentTime: number = +currentTimeP;
			const playlist: IPlaylist = JSON.parse(fs.readFileSync(playlistPath).toString());
			let totalTime: number = 0, currentSegment: ISegmentPlaylist;

			for (const seg of playlist.segments) {
				totalTime += seg.duration;
				if (totalTime >= currentTime) {
					currentSegment = seg;
					break;
				}
			}

			if (!playlist) {
				throw Error("File not found!")
			}

			req.params.segmentFile = currentSegment.fileName;
			req.query.scale = scale;

			return this.streamSegmentFile(req.params.segmentFile, req, res)
		} catch (e) {
			console.error(e);
			return res.status(500).json({message: "error: " + e.message})
		}
	}

	@Get('/api/json')
	getRes(req: Request, res: Response) {
		res.setHeader("Cache-control", "public, max-age=3600")
		console.log("get json");
		res.json({data: "df"})
	}

	private setCacheControl(res: Response) {
		res.setHeader("Cache-Control", 'public, max-age=86400, immutable');
	}
};