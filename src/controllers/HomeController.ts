import {Get, Prefix} from "express-router-controller-khmer";
import PostService from "../services/PostService";

@Prefix('')
export default class HomeController {
	private readonly service: PostService = new PostService();
	@Get('/')
	async Home(req, res) {
		const posts = await this.service.getAll();
		res.render("index", {title: "YOUTUBE", info: "Crazy Tool", data: posts});
	}
	
	@Get('/watch-videos/:id')
	async playVideo(req, res) {
		const post = await this.service.getOne(req.params.id, undefined);
		const posts = await this.service.getAllRelatedPosts(req.params.id);
		console.log(post, "___________________________");
		res.render("media_player/index", {title: "YOUTUBE", info: "Crazy Tool", data: {post, posts}});
	}
};

