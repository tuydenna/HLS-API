import db from "../config/database/db";
import {Post} from "@prisma/client";

export default class PostService {
	async getAll(filter = undefined): Promise<Post> {
		return db.post.findMany({where: filter, include: {author: true, video: true}});
	}
	
	async getOne(id: string): Promise<Post> {
		return db.post.findFirst({where: {id}, include: {author: true, video: true}});
	}
	
	async getAllRelatedPosts(id: string): Promise<Post> {
		return db.post.findMany({where: {id: {not: id}}, include: {author: true, video: true}});
	}
	
	async increaseLike(id: string) {
		const post: Post = await db.post.findFirst({
			where: {id}
		}) as Post;
		return db.post.update({where: {id}, data: {likes: post.likes + 1}})
	}
	
	async decreaseLike(id: string) {
		const post: Post = await db.post.findFirst({
			where: {id}
		}) as Post;
		return db.post.update({where: {id}, data: {likes: post.likes - 1}});
	}
}