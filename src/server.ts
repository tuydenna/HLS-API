import express , {Express, Router} from "express";
import path from "path";
import cookieParser from "cookie-parser";
import {AutoRegisterControllers} from "express-router-controller-khmer";
import * as process from "process";
import dotenv from "dotenv";
import {AuthMiddleware} from "@config/middlewares/auth.middleware";
import {coresMiddleware} from "@config/middlewares/cores.middleware";
import {connectRabbitMQ} from "@lib/message-queue/mq-connector";
import RedisServer from "@lib/redis/redis-server";
import ResponseInterceptor from "@config/pipeline/reponse/response.interceptor";
import compression from "compression";
import morgan from "morgan";

dotenv.config();

(async function Server() {
    const app: Express = express();
    const port: number = Number(process.env.PORT || 3080);
    const router: Router = express.Router();

    //view engine setup
    app.set('views', path.join(process.cwd(), 'src/views'));
    app.set('view engine', 'ejs');

    app.use(express.json({limit: '5mb'}));
    app.use(express.urlencoded({ extended: false}));
    app.use(cookieParser());
    app.use(compression());

    if (process.env.NODE_ENV === "production") {
        app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'));
    } else {
        app.use(morgan("dev"));
    }

    app.use(express.static(path.join('public')));

    app.use(coresMiddleware());
    app.use(AuthMiddleware);

    app.use("/storages", express.static(path.join('storages'), {dotfiles: "ignore", index: false,  maxAge: '30d', immutable: true}));

    app.use(router);

     await AutoRegisterControllers({
         router,
         logging: true,
         classTransform: false,
         controllerPath: [path.join(__dirname, "controllers/*.js")],
         responseInterceptor: new ResponseInterceptor()
    });

    app.listen(port, async function (){
        await connectRabbitMQ();
        await new RedisServer().connect();
        console.log("server is running on port:" + "http://localhost:"+port);
    })
})()
