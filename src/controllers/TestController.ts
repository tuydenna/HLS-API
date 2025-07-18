import {Get, Prefix, Res} from "express-router-controller-khmer";
import PostService from "@services/PostService";
import ResBaseController from "@controllers/ResBaseController";
import SearchPostFilterDto from "@config/pipeline/dto/search-post-filter.dto";

@Prefix('/api/test')
export default class PostController  extends ResBaseController{
	
	private readonly service: PostService = new PostService();

	@Get("/")
	async getAll(@Res() res: SearchPostFilterDto) {
		console.log(new SearchPostFilterDto());
		type s = {[K in keyof SearchPostFilterDto]: ""}
		console.log(SearchPostFilterDto);
	}

};

