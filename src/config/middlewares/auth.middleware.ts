import {NextFunction} from "express";
import jwt, {JwtPayload} from "jsonwebtoken";
import {getEnv} from "@utils/index";
import {Response, Request} from "express";

const exceptPaths: string[] = ["/api/authentications/register", "/api/files/avatar", "/api/authentications/login"]

export function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
    console.warn("middleware", req.path, req.cookies);
    if (exceptPaths.includes(req.path) && req.method === "POST") {
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
}