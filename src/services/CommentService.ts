import db from "../config/database/db";
import {Comment, User} from "@prisma/client";
import UserService from "./UserService";

export default class CommentService {
	async getAll(filter = undefined) {
		return db.post.findMany({where: filter, include: {author: true, video: true}});
	}
	
	async getOne(id: string, userId: string | undefined){
		return db.comment.findFirst();
	}
	
	async create(data: {postId: string, userId: string, text: string, authId: string}): Promise<Comment> {
		const auth: User =  await new UserService().getOne(data.authId);
		return db.comment.create({
			data: {
				author: {
					set: {
						id: auth.id,
						name: auth.name,
						avatar: auth.avatar
					}
				},
				postId: data.postId,
				text: data.text
			}
		});
	}
	
	async delete(id) {
		return await db.comment.delete({where: id});
	}
	
}