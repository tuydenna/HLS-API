import db from "@lib/prisma/db-connector";
import {Post, PostStatus} from "@prisma/client";
import SearchPostFilterDto from "@config/pipeline/dto/search-post-filter.dto";

export default class SearchEnginService {
	async searchAutocompletes(searchKey: string): Promise<string[]> {
		const posts: Post[] = await db.post.findMany({
			where: {
				title: {startsWith: searchKey, mode: "insensitive"},
				status: PostStatus.PUBLISHED
			},
			take: 5
		});
		return posts.map(post => post.title);
	}

	async searchPosts(filter: SearchPostFilterDto): Promise<Post[]> {
		const posts: Post[] = await db.post.findMany({
			where: {
				title: {contains: filter.searchKey ? filter.searchKey : undefined, mode: "insensitive"},
				status: PostStatus.PUBLISHED
			},
			include: {author: true},
			take: +filter.take,
			skip: +filter.skip,
			orderBy: {createdAt: "asc"}
		});
		return posts;
	}
}