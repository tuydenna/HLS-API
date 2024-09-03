import db from "../config/database/db";
import {Post} from "@prisma/client";

export default class CommentService {
	async getAll(filter = undefined) {
		return db.post.findMany({where: filter, include: {author: true, video: true}});
	}
	
	async getOne(id: string, userId: string | undefined): Promise<Post> {
		return db.comment.findFirst();
	}
	
	async create(data) {
		return db.comment.create({data: {postId: data.postId, comment: data.comment}});
	}
	
	async delete(id) {
		return db.comment.delete({where: id});
	}
	
}