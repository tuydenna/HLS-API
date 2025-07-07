import {Get, Post, Put, Prefix} from "express-router-controller-khmer";
import PostService from "@services/PostService";
import ResBaseController from "@controllers/ResBaseController";
import {Request, Response} from "express";

@Prefix('/api/posts')
export default class PostController  extends ResBaseController{
	
	private readonly service: PostService = new PostService();

	@Get("/")
	async getAll(req: Request, res: Response) {
		console.log(req.cookies, req.get("cookie"));
		return this.resSuccess(res, await this.service.getAll())
	}

	@Post("/")
	async create(req: Request, res: Response) {
		try {
			return this.resSuccess(res, await this.service.create(req.body));
		} catch (e) {
			return this.resError(res, e.message)
		}
	}

	@Get("/:id")
	async getOne(req: Request, res: Response) {
		return this.resSuccess(res, await this.service.getOne(req.params.id, req["auth"].id));
	}

	@Put("/:id/likes")
	async likePost(req: Request<{id: string}, null , null, {authId: string}>, res: Response) {
		return this.resSuccess(res, await this.service.likePost(req.params.id, req.query.authId))
	}
	
	@Put("/:id/dislikes")
	async disLikePost(req: Request<{id: string}, null , null, {authId: string}>, res: Response) {
		return this.resSuccess(res, await this.service.disLikePost(req.params.id, req.query.authId))
	}

};

