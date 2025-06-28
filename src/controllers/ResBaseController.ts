import {Response} from "express";

export default class ResBaseController {
	resSuccess(response: Response, data: any) {
		return response.json({data, message: "success" });
	}

	resError(response: Response, message: string = "internal error") {
		return response.status(500).json({message});
	}
}