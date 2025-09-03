import {Get, Post, Put, Prefix, Res, Body, Param, Req, Delete} from "express-router-controller-khmer";
import PostService from "@services/PostService";
import ResBaseController from "@controllers/ResBaseController";
import {Request, Response} from "express";

@Prefix('/api/posts')
export default class PostController  extends ResBaseController{

	private readonly service: PostService = new PostService();

	@Get("/:id")
	async getOne(@Param("id") id: string, @Req() req: Request, @Res() res: Response) {
		return this.resSuccess(res, await this.service.getOne(id, req["auth"].id));
	}

	@Get("")
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

	@Delete("/:id")
	async delete(@Param("id") id: string, @Res() res: Response) {
		return this.resSuccess(res, await this.service.delete(id));
	}

	@Put("/:id/likes")
	async likePost(@Param("id")  id: string, @Req() req: Request, @Res() res: Response) {
		return this.resSuccess(res, await this.service.likePost(id, req["auth"].id))
	}
	
	@Put("/:id/dislikes")
	async disLikePost(@Param("id")  id: string, @Req() req: Request, @Res() res: Response) {
		return this.resSuccess(res, await this.service.disLikePost(id, req["auth"].id));
	}

	@Put("/:id/views")
	async increaseView(@Param("id")  id: string, @Req() req: Request, @Res() res: Response) {
		try {
			return this.resSuccess(res, await this.service.increaseViews(id, req["auth"].id))
		} catch (e) {
			return this.resError(res, e.message)
		}
	}

};

