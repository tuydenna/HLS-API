import {IResponseInterceptor} from "@lib/routing-controller/types/interceptor";
import e from "express";

export default class DefaultResponseException implements IResponseInterceptor {
    response(data: any, req: e.Request, res: e.Response) {
        res.status(200).json(data);
    }
}