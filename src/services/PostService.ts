import db from "@config/database/db";
import {LikePost, Post, PostStatus} from "@prisma/client";
import {faker} from "@faker-js/faker";
import {sendMQ} from "@lib/message-queue/mq-connector";
import {redisExist, redisSetExpire} from "@lib/redis/redis-adapter";

export default class PostService {
	async getAll(filter = undefined) {
		return db.post.findMany({
			where: filter,
			include: {author: true, video: true},
			take: 10,
			orderBy: {createdAt: "asc"}
		});
	}
	
	async getOne(id: string, userId: string | undefined): Promise<Post> {
		const post = await db.post.findFirstOrThrow({
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

	async create(data: Post): Promise<Post> {
		const post = await db.post.create({
			data: {
				...data,
				slug: faker.lorem.slug()
			},
			include: {author: true, video: true}
		});
		sendMQ({...post.video, postId: post.id});
		return post
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

	async increaseViews(postId: string, authId: string): Promise<Post> {
		const THROTTLE_SECONDS = 30 * 60; // 30 minutes
		const redisKey = `view:${postId}:${authId}`;

		const alreadyViewed: boolean = await redisExist(redisKey);

		if (alreadyViewed) {
			throw Error('View already counted recently');
		}

		const post: Post = await db.post.findFirstOrThrow({where: {id: postId}});
		post.views += 1;

		await db.post.update({where: {id: postId}, data: {views: post.views}});
		await redisSetExpire(redisKey, THROTTLE_SECONDS, true);

		return post;
	}

	updatePostFromQueue(id: string, updateData: {status: PostStatus, duration?: number}): Promise<Post> {
		return db.post.update({
			where: {id},
			data: {
				status: updateData.status,
				video: {
					update: {
						data: {
							duration: updateData.duration
						}
					}
				}
			}
		});
	}
}