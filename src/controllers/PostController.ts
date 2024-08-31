import {Prefix} from "../config/ExpressMethod";
import {Put} from "express-router-controller-khmer";
import PostService from "../services/PostService";

@Prefix('/api/posts')
export default class PostController {
	
	private readonly service: PostService = new PostService();
	
	@Put("/:id/increase-likes")
	async increaseLike(req, res) {
		return res.send(await this.service.increaseLike(req.params.id));
	}
	
	@Put("/:id/decrease-likes")
	async decreaseLike(req, res) {
		return res.send(await this.service.decreaseLike(req.params.id));
	}
};

