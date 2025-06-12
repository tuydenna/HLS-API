import {Post, Prefix} from "../config/ExpressMethod";
import {Delete} from "express-router-controller-khmer";
import CommentService from "../services/CommentService";

@Prefix('/api/comments')
export default class CommentController {
	
	private readonly service: CommentService = new CommentService();
	
	@Post("/")
	async create(req, res) {
		return res.json(await this.service.create(req.body));
	}
	
	@Delete("/:id")
	async delete(req, res) {
		return res.json(await this.service.delete(req.params.id));
	}
};

