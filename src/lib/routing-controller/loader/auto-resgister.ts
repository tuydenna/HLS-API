// Automatically load and use controllers with decorated methods
import {Router} from "express";
import MainLoad from "@lib/routing-controller/loader/main-loader";
import {IAutoRegister} from "@lib/routing-controller/types/loader";
import {IInterceptors} from "@lib/routing-controller/types/interceptor";

export default class AutoRegisterController extends MainLoad implements IAutoRegister {

    constructor(router: Router, controllerPath: string[], logger: boolean = false, interceptors: IInterceptors) {
        super(router, controllerPath, logger, interceptors);
    }

    getAllRegisterRoutes(): string[] {
        return this.routes;
    }
}
