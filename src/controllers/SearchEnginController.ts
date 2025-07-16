import {Prefix, Get, Param, Query} from "express-router-controller-khmer";
import ResBaseController from "@controllers/ResBaseController";
import SearchEnginService from "@services/SearchEnginService";

@Prefix('/api/searches')
export default class SearchEnginController extends ResBaseController {
	private searchEnginService: SearchEnginService = new SearchEnginService();

	@Get("/:searchKey/autocompletes")
	async searchAutocompletes(@Param("searchKey") searchKey: string): Promise<any> {
		return this.searchEnginService.searchAutocompletes(searchKey);
	}

	@Get("/posts")
	async searchPosts(@Query() filter): Promise<any> {
		return this.searchEnginService.searchPosts(filter);
	}
};

