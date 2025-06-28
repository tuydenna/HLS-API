import {Delete, Post, Prefix} from "express-router-controller-khmer";
import CommentService from "@services/CommentService";
import ResBaseController from "@controllers/ResBaseController";

@Prefix('/api/comments')
export default class CommentController extends ResBaseController {
	
	private readonly service: CommentService = new CommentService();
	
	@Post("/")
	async create(req, res) {
		return this.resSuccess(res, await this.service.create(req.body))
	}
	
	@Delete("/:id")
	async delete(req, res) {
		return this.resSuccess(res, await this.service.delete(req.params.id))
	}
};

