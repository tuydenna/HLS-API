import createHttpError from "http-errors";
import express, {Express, Router} from "express";
import path from "path";
import cookieParser from "cookie-parser";
import AutoRegisterControllers from "@lib/routing-controller";
import * as process from "process";
import dotenv from "dotenv";
import {AuthMiddleware} from "@config/middlewares/auth.middleware";
import {coresMiddleware} from "@config/middlewares/cores.middleware";
import {connectRabbitMQ} from "@lib/message-queue/mq-connector";
import RedisServer from "@lib/redis/redis-server";

dotenv.config();

const app: Express = express();
const port: number = Number(process.env.PORT || 3080);
const router: Router = express.Router();

//view engine setup
app.set('views', path.join(process.cwd(), 'src/views'));
app.set('view engine', 'ejs');

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());
app.use(express.static(path.join('public')));
app.use(express.static(path.join('storages')));

app.use(coresMiddleware());
app.use(AuthMiddleware)
app.use(router);

//AutoRegisterControllers({router, logging: true, controllerPath: [OtherController/*, UserController, StreamController,*/, path.join(__dirname, "controllers/*.js")]});

router.post("/api/uncatch", function (req, res,next) {
    console.log(req.body);
    next(new Error("Not Found"));
})

AutoRegisterControllers({
    router,
    logging: true,
    controllerPath: [path.join(__dirname, "controllers/*.js")]
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createHttpError(404));

});

// error handler
app.use(function(err, req, res, next) {
    console.warn("[Global interceptor]:", err.code, err.message, err);
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send({message: err.message});
});

app.listen(port, async function (){
    // await connectRabbitMQ();
    // await new RedisServer().connect();
    console.log("server is running on port:" + "http://localhost:"+port);
})