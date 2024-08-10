import {Get, Prefix} from "../config/ExpressMethod";
import fs from "fs";
import {storage_path, video_path} from "../constant/path";

@Prefix('')
export default class StreamController {
	@Get('/streaming')
	loadStream(req, res): any {
		res.setHeader("Cache-Control", "public, max-age=604800")
		res.render("streamingV2", {title: "Margay", info: "Margay Is a Cutest cats ever!"})
	}
	
	@Get('/api/streaming/videos/:src')
	async saveStream(req, res) {
		const videoPath          = storage_path + req.params.src;
		const videoSize 		= fs.statSync(videoPath).size;
		const chuckSize 		= 1 * 10 ** 6; // 1== 1MB
		const requestedRange 	= req.headers.range || '';
		const start			= Number(requestedRange.replace(/\D/g, ''));
		const end 				= Math.min(start + chuckSize, videoSize - 1); // 1== 1MB
		const contentLength 	= end - start + 1; // 1== 1MB
		const videoStream= fs.createReadStream(videoPath, { start, end});
		
		if (!req.headers.range){
			console.log(req.headers);
			return res.status(400).send("Range required!")
		}
		
		const headers = {
			'Cache-Control': 'public, max-age=1000',
			"Accept-Ranges": "bytes",
			"Content-Range": `bytes ${start}-${end}/${videoSize}`,
			"Content-Length": contentLength,
			"Content-Type": "video/mp4"
		}
		res.writeHead(206, headers)
		videoStream.pipe(res);
	}
	
};

