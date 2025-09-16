import {Response} from "express";
import SysLog from "@lib/logger/sys-log";
import ErrorException from "@config/error/error-exception";

export default class ResBaseController {
	resSuccess(response: Response, data: any) {
		return response.status(200).json({data, message: "success" });
	}

	resError(response: Response, {message, code }: ErrorException) {
		SysLog.error("[Internal Service]", message || "Internal Error", code || 500);
		return response.status(code || 500).json({message: message || "Internal Error"});
	}
}