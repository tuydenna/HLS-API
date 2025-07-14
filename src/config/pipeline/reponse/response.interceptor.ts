import {IResponseInterceptor} from "express-router-controller-khmer";
import {Request, Response} from "express";

export default class ResponseInterceptor implements IResponseInterceptor {

    response(data: any, req: Request, res: Response) {
        res.json({data});
    }

}