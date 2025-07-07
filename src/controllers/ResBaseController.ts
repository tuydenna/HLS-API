import {Response} from "express";

export default class ResBaseController {
	resSuccess(response: Response, data: any) {
		return response.json({data, message: "success" });
	}

	resError(response: Response, message: string = "internal error", code =500) {
		console.log(message);
		return response.status(code).json({message});
	}
}