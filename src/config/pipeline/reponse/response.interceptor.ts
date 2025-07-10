import {IErrorInterceptor, IResponseInterceptor} from "@lib/routing-controller/types/interceptor";
import {Request, Response} from "express";

class ResponseInterceptor implements IResponseInterceptor {

    response(data: any, req: Request, res: Response): Promise<any> {
        return Promise.resolve(undefined);
    }

}