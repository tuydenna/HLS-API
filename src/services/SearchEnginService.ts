import db from "@lib/prisma/db-connector";
import {Post, PostStatus} from "@prisma/client";
import SearchPostFilterDto from "@config/pipeline/dto/search-post-filter.dto";
import AiModelClient from "@lib/ai-model/ai-model-client";
import {CircuitBreaker, retry} from "@utils/index";

export default class SearchEnginService {
	private readonly aiModelClientBreaker: CircuitBreaker;

	constructor() {
		this.aiModelClientBreaker = new CircuitBreaker();
	}

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
		const vectorSearchModelResponse = await this.aiModelClientBreaker.call(
			async () =>  retry(AiModelClient.search, searchText)
		);
		const vectorSearchIndexes: number[] = vectorSearchModelResponse.data;
		if (!searchText) {
			return db.post.findMany({
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

		const posts: Post[] = await db.post.findMany({
			where: {
				searchIndex: {in: vectorSearchIndexes}
			},
			include: {author: true},
			take: +filter.take,
			skip: +filter.skip,
		});
		return vectorSearchIndexes.map(id => posts.find(post => post.searchIndex === id))?.filter(Boolean);
	}

	private regexEscapeSpecialChars(str: string) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}