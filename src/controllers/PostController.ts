import {Prefix} from "../config/ExpressMethod";
import {Get, Post, Put} from "express-router-controller-khmer";
import PostService from "../services/PostService";

@Prefix('/api/posts')
export default class PostController {
	
	private readonly service: PostService = new PostService();

	@Get("/")
	async getAll(req, res) {
		const posts = await this.service.getAll();
		return res.json({data: posts});
	}

	@Post("/")
	async create(req, res) {
		try {
			console.log(req.body);
			const posts = await this.service.create(req.body);
			return res.json({data: posts});
		} catch (e) {
			throw e
			return res.status(500).json({message: e.message});
		}

	}

	@Get("/:id")
	async getOne(req, res) {
		const post = await this.service.getOne(req.params.id, undefined);
		return res.json({data: post});
	}

	@Put("/:id/increase-likes")
	async increaseLike(req, res) {
		return res.send(await this.service.increaseLike(req.params.id, req.query.userId));
	}
	
	@Put("/:id/decrease-likes")
	async decreaseLike(req, res) {
		return res.send(await this.service.decreaseLike(req.params.id, req.query.userId));
	}

};

