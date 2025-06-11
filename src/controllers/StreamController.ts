import {Get, Prefix} from "../config/ExpressMethod";
import fs, {ReadStream} from "fs";
import {storage_path} from "../constant/path";
import {Request, Response} from "express"
import json from "../bin/seekable_frame.json";

@Prefix('')
export default class StreamController {

	@Get('/streaming')
	loadStream(req: Response, res: Response): any {
		res.setHeader("Cache-Control", "public, max-age=604800")
		res.render("streamingV2", {title: "Margay", info: "Margay Is a Cutest cats ever!"})
	}

	@Get('/api/stream-segment/fmp4/:segmentFile')
	async streamSegmentFile(req: Request, res: Response) {
		let segmentChunk: ReadStream;
		try {
			const videoPath: string = storage_path + "/videos/fmp4/" + req.params.segmentFile;
			const videoSize: number = fs.statSync(videoPath).size;
			segmentChunk = fs.createReadStream(videoPath);

			if (!req.params.segmentFile){
				console.error(req.params.segmentFile);
				return res.status(400).send("Segment File is required!")
			}

			const headers = {
				"Cache-Control": "max-age=1200",
				"Accept-Ranges": "bytes",
				"Content-Length": videoSize,
				"Content-Type": "video/mp4"
			}

			res.setHeader("Expires", (new Date(Date.now() + 60 * 60 * 1000).toUTCString()))
			console.log("get segment", req.params.segmentFile);
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

	@Get('/api/stream-segment/:src')
	async streamSegmentChunk(req: Request, res: Response) {
		try {
			const videoPath: string = storage_path + req.params.src;
			const videoSize: number = fs.statSync(videoPath).size;
			const requestedRange: number[] = req.headers.range.replace("bytes=", "").split("-").map(i => +i);
			const start: number	= Math.min(requestedRange[0],videoSize);
			const end: number 	= Math.min(requestedRange[1], videoSize); // 1== 1MB
			const contentLength: number = end - start + 1; // 1== 1MB
			const segmentChunk: ReadStream = fs.createReadStream(videoPath, { start, end: end ? end : undefined});

			if (!req.headers.range){
				console.error(req.headers);
				return res.status(400).send("Range required!")
			}

			const headers = {
				"Accept-Ranges": "bytes",
				"Content-Range": `bytes ${start}-${end}/${videoSize}`,
				"Content-Length": contentLength,
				"Content-Type": "video/mp4"
			}

			res.writeHead(206, headers)
			segmentChunk.pipe(res);
		} catch (e) {
			console.error(e);
			return res.status(500).send(e)
		}
	}

	@Get('/api/stream-segment/seekable-range/:seekTime')
	async findSeekingRangeHeader(req: Request, res: Response) {
		try {
			const seekTime: number = parseInt(req.params.seekTime);
			console.log(seekTime);
			let data;
			for (let i = 0; i < json.length; i++) {
				if (json[i].startTime >= seekTime && json[i].type === "I") {
					data = json[i-1];
					console.log(data);
					break;
				}
			}
			res.json({data: {time: data.startTime, start: data.startByte, end: data.startByte + (10 ** 6)}});
		} catch (e) {
			console.error(e);
			return res.status(500).send(e)
		}

	}

	@Get('/api/json')
	getRes(req: Request, res: Response) {
		res.setHeader("Cache-control", "max-age=5")
		console.log("get json");
		res.json({data: "df"})
	}
};

