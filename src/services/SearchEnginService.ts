import db from "@lib/prisma/db-connector";
import {Post, PostStatus} from "@prisma/client";
import SearchPostFilterDto from "@config/pipeline/dto/search-post-filter.dto";
import AiModelClient from "@lib/ai-model/ai-model-client";

export default class SearchEnginService {
	async searchAutocompletes(searchKey: string): Promise<string[]> {
		const posts: Post[] = await db.post.findMany({
			where: {
				title: {startsWith: this.regexEscapeSpecialChars(searchKey), mode: "insensitive"},
				status: PostStatus.PUBLISHED
			},
			take: 5
		});
		return posts.map(post => post.title);
	}

	async searchPosts(filter: SearchPostFilterDto): Promise<Post[]> {
		const searchText: string | undefined = filter.searchKey ? this.regexEscapeSpecialChars(filter.searchKey) : undefined
		const {data} = await AiModelClient.search(searchText)
		console.log(data, searchText, "searchText");

		if (!searchText) {
			return await db.post.findMany({
				where: {
					title: {contains: searchText, mode: "insensitive"},
					status: PostStatus.PUBLISHED
				},
				include: {author: true},
				take: +filter.take,
				skip: +filter.skip,
				orderBy: {createdAt: "asc"}
			});
		}

		const post_ai: Post[] = await db.post.findMany({
			where: {
				searchIndex: {
				in: data
				}
			},
			include: {author: true},
			take: +filter.take,
			skip: +filter.skip,
		});
		return data.map(id => post_ai.find(post=>post.searchIndex === id))

	}

	private regexEscapeSpecialChars(str: string) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}