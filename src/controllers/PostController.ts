import {Get, Post, Put, Prefix, Res, Body, Param, Req} from "express-router-controller-khmer";
import PostService from "@services/PostService";
import ResBaseController from "@controllers/ResBaseController";
import {Request, Response} from "express";

@Prefix('/api/posts')
export default class PostController  extends ResBaseController{
	
	private readonly service: PostService = new PostService();

	@Get("/")
	async getAll(@Res() res: Response) {
		return this.resSuccess(res, await this.service.getAll())
	}

	@Post("/")
	async create(@Body() data,  @Res() res: Response) {
		try {
			return this.resSuccess(res, await this.service.create(data));
		} catch (e) {
			return this.resError(res, e.message)
		}
	}

	@Get("/:id")
	async getOne(@Param("id") id: string, @Req() req: Request, @Res() res: Response) {
		return this.resSuccess(res, await this.service.getOne(id, req["auth"].id));
	}

	@Put("/:id/likes")
	async likePost(req: Request<{id: string}, null , null, {authId: string}>, res: Response) {
		return this.resSuccess(res, await this.service.likePost(req.params.id, req.query.authId))
	}
	
	@Put("/:id/dislikes")
	async disLikePost(req: Request<{id: string}, null , null, {authId: string}>, res: Response) {
		return this.resSuccess(res, await this.service.disLikePost(req.params.id, req.query.authId))
	}

	@Put("/:id/views")
	async increaseView(req: Request<{id: string}, null , null, {authId: string}>, res: Response) {
		return this.resSuccess(res, await this.service.increaseViews(req.params.id, req["auth"].id))
	}

};

