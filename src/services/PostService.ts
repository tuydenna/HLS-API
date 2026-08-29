import db from "@lib/prisma/db-connector";
import {LikePost, Post, PostStatus, Quality} from "@prisma/client";
import {faker} from "@faker-js/faker";
import {mqEventProducer} from "@lib/message-queue/mq-event-producer";
import {redisExist, redisSetExpire} from "@lib/redis/redis-adapter";
import storageEngine from "@services/StorageEngine";
import {getStorageLink} from "@constant/path";
import sysLog from "@lib/logger/sys-log";
import ErrorException from "@config/error/error-exception";
import SysLog from "@lib/logger/sys-log";
import AiModelClient from "@lib/ai-model/ai-model-client";
import FileService from "@services/FileService";
import {Inject, Injectable} from "express-router-controller-khmer";
import {PostWithAuthorAndVideo} from "@interfaces/user-query";

@Injectable()
export default class PostService {
    @Inject()
    private readonly fileService: FileService;

    constructor() {
        this.fileService = new FileService();
    }

    async getAll(filter = undefined) {
        return db.post.findMany({
            where: filter,
            include: {author: true, video: true},
            take: 10,
            orderBy: {createdAt: "asc"}
        });
    }

    async getAuthorized(authId: string) {
        return db.post.findMany({
            where: {authorId: authId},
            include: {author: true, video: true},
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
        let post: PostWithAuthorAndVideo | null;

        try {
            const lastPost: Post | null = await db.post.findFirst({take: 1, orderBy: {createdAt: "desc"}});
            post = await db.post.create({
                data: {
                    ...data,
                    searchIndex: lastPost ? lastPost.searchIndex + 1 : 1,
                    slug: faker.lorem.slug()
                },
                include: {author: true, video: true}
            });
            console.log("sendMQSegmentUpload", post);
            await AiModelClient.trainModel(post);
            mqEventProducer.sendMQSegmentUpload({...post.video, postId: post.id});
            return post
        } catch (error) {
            // remove all saving data and storages
            SysLog.error("create post", error);
            await this.rollBackPost(post);
            throw error;
        }
    }

    async delete(id: string): Promise<string> {
        const post: PostWithAuthorAndVideo = await db.post.findFirst({
            where: {id},
            include: {author: true, video: true}
        });
        if (!post) {
            throw new ErrorException("post not found", ErrorException.NOT_FOUND_CODE);
        }
        await this.rollBackPost(post);
        return "Deleted Successfully"
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
        const THROTTLE_SECONDS: number = 30 * 60; // 30 minutes
        const redisKey = `view:${postId}:${authId}`;

        const alreadyViewed: boolean = await redisExist(redisKey);

        if (alreadyViewed) {
            throw new ErrorException('View already counted recently', ErrorException.BAD_REQUEST_CODE);
        }

        const post: Post = await db.post.findFirstOrThrow({where: {id: postId}});
        post.views += 1;

        await db.post.update({where: {id: postId}, data: {views: post.views}});
        await redisSetExpire(redisKey, THROTTLE_SECONDS, true);

        return post;
    }

    async updatePostFromQueue(id: string, updateData: {
        status: PostStatus,
        hasAudio?: boolean,
        duration?: number,
        quality?: Quality[]
    }): Promise<Post> {
        try {
            return await db.post.update({
                where: {id},
                data: {
                    status: updateData.status,
                    video: {
                        update: {
                            data: {
                                hasAudio: updateData.hasAudio,
                                duration: updateData.duration,
                                quality: updateData.quality
                            }
                        }
                    }
                }
            });
        } catch (e) {
            sysLog.error("[updatePostFromQueue]", e);
            return null;
        }
    }

    private async rollBackPost(post: PostWithAuthorAndVideo | null) {
        try {
            if (!post) return;
            await db.comment.deleteMany({where: {postId: post.id}});
            await db.likePost.deleteMany({where: {postId: post.id, userId: post.authorId}});
            await db.post.delete({where: {id: post.id}});
            await db.file.delete({where: {id: post.videoId}});
            if (storageEngine.isExist(getStorageLink(post.thumbnail))) {
                storageEngine.remove(getStorageLink(post.thumbnail));
            }
            if (storageEngine.isExist(getStorageLink(post.video.dirPath))) {
                storageEngine.remove(getStorageLink(post.video.dirPath), {recursive: true, force: true});
            }
            mqEventProducer.sendMQClearStorage(post.video);
        } catch (e) {
            sysLog.error("rollback post", e)
            throw new Error("rollback post is error");
        }
    }
}