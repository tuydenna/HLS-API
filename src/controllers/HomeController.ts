import {Get, Prefix} from "../config/ExpressMethod";
import PostService from "../services/PostService";

@Prefix('')
export default class HomeController {
	private readonly service: PostService = new PostService();
	@Get('/')
	async Home(req, res): any {
		const posts = await this.service.getAll();
		res.render("index", {title: "YOUTUBE", info: "Crazy Tool", data: posts});
	}
	
	@Get('/watch-videos/:id')
	async playVideo(req, res): any {
		const posts = await this.service.getOne(req.params.id);
		const allPosts = await this.service.getAllRelatedPosts(req.params.id);
		res.render("media_player/index", {title: "YOUTUBE", info: "Crazy Tool", data: posts, allPosts});
	}
};

