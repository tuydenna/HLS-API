import {Body, Delete, Param, Post, Prefix, Res} from "express-router-controller-khmer";
import CommentService from "@services/CommentService";
import ResBaseController from "@controllers/ResBaseController";
import {Response} from "express";

@Prefix('/api/comments')
export default class CommentController extends ResBaseController {
	
	private readonly service: CommentService = new CommentService();
	
	@Post("/")
	async create(@Body() data, @Res() res: Response) {
		return this.resSuccess(res, await this.service.create(data))
	}
	
	@Delete("/:id")
	async delete(@Param("id") id: string, @Res() res: Response) {
		return this.resSuccess(res, await this.service.delete(id))
	}
};

