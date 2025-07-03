import db from "@config/database/db";
import {LikePost, Post} from "@prisma/client";
import {faker} from "@faker-js/faker";

export default class PostService {
	async getAll(filter = undefined) {
		return db.post.findMany({where: filter, include: {author: true, video: true}});
	}
	
	async getOne(id: string, userId: string | undefined): Promise<Post> {
		console.log("userId", userId);
		const post = await db.post.findFirst({
			where: {id},
			include: {
				author: true,
				video: true,
				likePosts: {where: {userId}, take: 1},
				comments: {
					orderBy: {createdAt: "desc"},
					take: 10
				}
			}
		});
		if (!("likePosts" in post)) {
			// @ts-ignore
			post["likePosts"] = [];
		}
		return post
	}

	create(post: Post): Promise<Post> {
		return db.post.create({ data: {...post, slug: faker.lorem.slug()}, include: {author: true}});
	}

	async getAllRelatedPosts(id: string) {
		return db.post.findMany({where: {id: {not: id}}, include: {author: true, video: true}});
	}
	
	async likePost(postId: string, userId: string): Promise<Post> {
		const post: Post = await db.post.findFirstOrThrow({
			where: {id: postId}
		}) as Post;

		const likePost: LikePost | null = await db.likePost.findFirst({
			where: {postId, userId}
		});

		if (likePost && likePost.like === true) {
			return post;
		}

		if (likePost && likePost.like === false) {
			await db.likePost.update({where: {id: likePost.id}, data: {like: true}});
		} else {
			await db.likePost.create({data: {postId, userId, like: true}});
		}

		return db.post.update({where: {id: postId}, data: {likes: post.likes + 1}});
	}

	async disLikePost(postId: string, userId: string): Promise<Post> {
		const post: Post = await db.post.findFirstOrThrow({
			where: {id: postId}
		}) as Post;

		const likePost: LikePost | null = await db.likePost.findFirst({
			where: {postId, userId}
		});

		if (likePost && likePost.like === false) {
			return post;
		}

		if (likePost && likePost.like === true) {
			await db.likePost.update({where: {id: likePost.id}, data: {like: false}});
		} else {
			await db.likePost.create({data: {postId, userId, like: false}});
		}

		return db.post.update({where: {id: postId}, data: {likes: post.likes - 1}});
	}
}