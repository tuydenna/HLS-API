import {Response} from "express";
import SysLog from "@lib/logger/sys-log";
import ErrorException from "@config/error/error-exception";

export default class ResBaseController {
	resSuccess(response: Response, data: any) {
		return response.json({data, message: "success" });
	}

	resError(response: Response, {message, code}: ErrorException) {
		SysLog.error("[Internal Service]", message, code);
		return response.status(code).json({message});
	}
}