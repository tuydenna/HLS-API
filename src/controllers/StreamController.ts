import {Get, Prefix} from "express-router-controller-khmer";
import fs, {ReadStream} from "fs";
import {getStorageLink} from "@constant/path";
import {Request, Response} from "express"
import FileService from "../services/FileService";
import {File} from "@prisma/client"
import {IPlaylist, ISegmentPlaylist} from "@interfaces/stream";

@Prefix('/api/streams/fmp4')
export default class StreamController {

	@Get('/:fileId/:segmentFile')
	async streamSegmentFile(req: Request, res: Response) {
		let segmentChunk: ReadStream;
		try {
			const video: File | null = await new FileService().getOne(req.params.fileId);
			if (!video) {
				throw Error("File not found!")
			}

			const videoPath: string = getStorageLink(video.dirPath + "/" + req.params.segmentFile) ;
			const videoSize: number = fs.statSync(videoPath).size;
			segmentChunk = fs.createReadStream(videoPath);

			if (!req.params.segmentFile){
				console.error(req.params.segmentFile);
				return res.status(400).send("Segment File is required!")
			}

			const headers = {
				"X-Segment-Name":  req.params.segmentFile,
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
	async streamSeekingSegmentFile(req: Request, res: Response) {
		try {
			const video: File | null = await new FileService().getOne(req.params.fileId);

			if (!video) {
				throw Error("File not found!")
			}

			const playlistPath: string = getStorageLink(video.dirPath, "/playlist.json");
			const currentTime: number = +req.params.currentTime;
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

			return this.streamSegmentFile(req, res)
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

