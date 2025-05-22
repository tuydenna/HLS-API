import db from "../config/database/db";
import {Post} from "@prisma/client";

export default class PostService {
	async getAll(filter = undefined) {
		return db.post.findMany({where: filter, include: {author: true, video: true}});
	}
	
	async getOne(id: string, userId: string | undefined): Promise<Post> {
		const post = await db.post.findFirst({
			where: {id},
			include: {
				author: true,
				video: true,
				likePosts: userId ? {where: {userId}} : false,
				comments: true
			}
		});
		if (!("likePosts" in post)) {
			// @ts-ignore
			post["likePosts"] = [];
		}
		return post
	}
	
	async getAllRelatedPosts(id: string) {
		return db.post.findMany({where: {id: {not: id}}, include: {author: true, video: true}});
	}
	
	async increaseLike(postId: string, userId: string) {
		const post: Post = await db.post.findFirst({
			where: {id: postId}
		}) as Post;
		
		const likePost = await db.likePost.findMany({
			where: {postId, userId}
		});
		
		if(likePost.length) {
			await db.likePost.update({where: {id: likePost[0].id}, data: {like: true}})
		} else {
			await db.likePost.create( {data: {postId, userId, like: true}});
		}
		
		return await db.post.update({where: {id: postId}, data: {likes: post.likes + 1}});
	}
	
	async decreaseLike(postId: string, userId: string) {
		const post: Post = await db.post.findFirst({
			where: {id: postId}
		}) as Post;
		
		await db.likePost.updateMany({where: {userId, postId}, data: {like: false}})
		
		return await db.post.update({where: {id: postId}, data: {likes: post.likes - 1}});
	}
}