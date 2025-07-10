import {IErrorInterceptor} from "@lib/routing-controller/types/interceptor";
import {Request, Response} from "express";

class ErrorInterceptor implements IErrorInterceptor {
    errorException(error: any, req: Request, res: Response): Promise<void> {
        return Promise.resolve(undefined);
    }

}