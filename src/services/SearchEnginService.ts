import db from "@config/database/db";
import {Post} from "@prisma/client";

export default class SearchEnginService {
	async searchAutocompletes(searchKey: string): Promise<string[]> {
		const posts: Post[] = await db.post.findMany({where: {title: {startsWith: searchKey, mode: "insensitive"}}, take: 5});
		return posts.map(post => post.title);
	}

	async searchPosts(filter: {searchKey: string, take: number, skip: number}): Promise<Post[]> {
		const posts: Post[] = await db.post.findMany({
			where: {
				title: {
					contains: filter.searchKey ? filter.searchKey : undefined, mode: "insensitive"}
			},
			include: {author: true},
			take: +filter.take,
			skip: +filter.skip,
			orderBy: {createdAt: "asc"}
		});
		return posts;
	}
}