import {Request, Response} from "express";
import {Prefix, Get} from "express-router-controller-khmer";
import ResBaseController from "@controllers/ResBaseController";
import SearchEnginService from "@services/SearchEnginService";

@Prefix('/api/searches')
export default class SearchEnginController extends ResBaseController {
	private searchEnginService: SearchEnginService = new SearchEnginService();

	@Get("/:searchKey/autocompletes")
	async searchAutocompletes(req: Request, res: Response): Promise<any> {
		return this.searchEnginService.searchAutocompletes(req.params.searchKey);
	}

	@Get("/posts")
	async searchPosts(req: Request, res: Response): Promise<any> {
		return this.searchEnginService.searchPosts(req.query);
	}
};

