import {Get, Param, Prefix, Req, Res} from "express-router-controller-khmer";
import fs, {ReadStream} from "fs";
import {getStorageLink} from "@constant/path";
import {Request, Response} from "express"
import FileService from "@services/FileService";
import {File} from "@prisma/client"
import {IPlaylist, ISegmentPlaylist} from "@interfaces/stream";
import {formatPlaylistM3u8APIEndPoint} from "../helper/stream-helper";
import {getEnv} from "@utils/index";

@Prefix('/api/streams/fmp4')
export default class StreamController {

	@Get('/:fileId/playlist')
	async getPlaylistFile(@Req() req: Request, @Res() res: Response) {
		try {
			const video: File | null = await new FileService().getOne(req.params.fileId);
			if (!video) {
				throw Error("File not found!")
			}

			const api: string = getEnv("STREAM_ENDPOINT") + "/"+video.id+"/";
			const segmentFile = "playlist.m3u8";

			const videoPath: string = getStorageLink(video.dirPath + "/" + segmentFile) ;
			const videoSize: number = fs.statSync(videoPath).size;

			if (!segmentFile){
				console.error(segmentFile);
				return res.status(400).send("Segment File is required!")
			}

			let playlist: Buffer = fs.readFileSync(videoPath);
			playlist = formatPlaylistM3u8APIEndPoint(playlist, api);

			res.setHeader("Content-Length", videoSize)
			res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
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

			const videoPath: string = getStorageLink(video.dirPath + "/" + segmentFile) ;
			const videoSize: number = fs.statSync(videoPath).size;
			segmentChunk = fs.createReadStream(videoPath);

			if (!segmentFile){
				console.error(segmentFile);
				return res.status(400).send("Segment File is required!")
			}

			const headers = {
				"X-Segment-Name":  segmentFile,
				"Access-Control-Expose-Headers": "X-Segment-Name",
				"Cache-Control": "max-age=1200",
				"Accept-Ranges": "bytes",
				"Content-Length": videoSize,
				"Content-Type": "video/mp4"
			}

			res.writeHead(206, headers)

			segmentChunk.pipe(res, {end: true});

			segmentChunk.on("end", () => {
				segmentChunk.close();
				res.end();
			})
		} catch (e) {
			console.error(e);
			if (e.code === "ENOENT") {
				return res.status(404).json({message: "segment not found!"})
			}
			segmentChunk.close();
			return res.status(500).json({message: "error: "+e.message})
		}
	}

	@Get('/seeks/:fileId/:currentTime')
	async streamSeekingSegmentFile(@Param("fileId") fileId: string, @Param("currentTime") currentTimeP: string, @Req() req: Request, @Res() res: Response) {
		try {
			const video: File | null = await new FileService().getOne(fileId);

			if (!video) {
				throw Error("File not found!")
			}

			const playlistPath: string = getStorageLink(video.dirPath, "/playlist.json");
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
};

