import createHttpError from "http-errors";
import express, {Express, NextFunction, Router,} from "express";
import path from "path";
import cookieParser from "cookie-parser";
import AutoRegisterControllers from "./index";
import * as process from "process";
import dotenv from "dotenv";
import cores from "cors"
import jwt, {JwtPayload} from "jsonwebtoken";
import {getEnv} from "./utils";

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
app.use(cores({
    origin: function (url, cb) {
        const whiteList = ["http://localhost:3000"]
        if (whiteList.indexOf(url) === -1 && url) {
            return cb(new Error("Origin is not a valid URL"));
        }
        return cb(null, true);
    } ,
    credentials: true
}));

app.use((req: express.Request, res: express.Response, next: NextFunction) => {
    console.log("middleware", req.path, req.cookies);
    if (["/api/authentications/register", "/api/files/avatar"].includes(req.path) && req.method === "POST") {
        // return next("/api/files/avatar");
        return next()
    }
    try {
        const payload: JwtPayload = jwt.verify(req.cookies.auth_token, getEnv("JWT_SECRET")) as JwtPayload;
        req["auth"] = {id: payload.authId};
        return next()
    } catch (e) {
        console.error("[JWT_ERROR]: ", e, req.path, req.cookies.auth_token);
        return res.status(401).json({message: "Unauthorized"});
    }
})

app.use(router);

//AutoRegisterControllers({router, logging: true, controllerPath: [OtherController/*, UserController, StreamController,*/, path.join(__dirname, "controllers/*.js")]});
AutoRegisterControllers({router, logging: false, controllerPath: [path.join(__dirname, "controllers/*.js")]});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createHttpError(404));
});

// error handler
app.use(function(err, req, res, next) {
    console.warn( err.message);
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send({message: err.message});
});

app.listen(port, function (){
    console.log("server is running on port:" + "http://localhost:"+port);
})
