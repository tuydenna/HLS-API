import {Get, Prefix} from "../config/ExpressMethod";
import db from "../config/database/db";

@Prefix('')
export default class HomeController {
	@Get('/')
	async Home(req, res): any {
		const posts = await db.post.findMany({
			include: {
				author: true,
				video: true
			}
		})
		res.render("index", {title: "YOUTUBE", info: "Crazy Tool", data: posts});
	}
	
	@Get('/watch-videos/:id')
	async playVideo(req, res): any {
		const posts = await db.post.findFirst( {
			where: {id: req.params.id},
			include: {
				author: true,
				video: true
			}
		})
		res.render("media_player/index", {title: "YOUTUBE", info: "Crazy Tool", data: posts});
	}
};

