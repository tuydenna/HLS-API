import {Response} from "express";
import SysLog from "@lib/logger/sys-log";

export default class ResBaseController {
	resSuccess(response: Response, data: any) {
		return response.json({data, message: "success" });
	}

	resError(response: Response, message: string = "internal error", code =500) {
		SysLog.error("[Internal Service]", message, code);
		return response.status(code).json({message});
	}
}