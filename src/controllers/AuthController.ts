import ResBaseController from "@controllers/ResBaseController";
import {Post, Prefix, Put} from "express-router-controller-khmer";
import {User} from "@prisma/client";
import UserService from "@services/UserService";
import {Response, Request} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {getEnv} from "@utils/index";
import {StringValue} from "ms";

@Prefix("/api/authentications")
export default class AuthController extends ResBaseController {
    private readonly userService: UserService = new UserService();

    @Post("/login")
    async login(req: Request, res: Response) {
        try {
            const auth: User = await this.userService.getOneByUsername(req.body.username);
            if (!auth) {
                return this.resError(res, "Invalid credentials", 400);
            }
            const isCorrectPass:boolean = await bcrypt.compare( req.body.password, auth.password);
            if (!isCorrectPass) {
                return this.resError(res, "Invalid credentials", 400);
            }

            const token: string = jwt.sign({authId: auth.id}, getEnv("JWT_SECRET") || "", {expiresIn: getEnv("JWT_EXPIRE_IN") as StringValue});

            await this.userService.update({id: auth.id}, {token});
            this.setHeaderAuthCookie(res, token);

            return this.resSuccess(res, auth);
        } catch (error) {
            return this.resError(res, error);
        }
    }

    @Post("/register")
    async register(req: Request, res: Response) {
        try {
            const user: User = await this.userService.create(req.body);
            this.setHeaderAuthCookie(res, user.token);
            return this.resSuccess(res, user);
        } catch (e) {
            return this.resError(res, e.message);
        }
    }

    @Put("/logout")
    logout(req: Request, res: Response) {
        res.clearCookie('auth_token');
        return this.resSuccess(res, "logout success!");
    }

    private setHeaderAuthCookie(res: Response, token: string): Response<any, Record<string, any>> {
        return res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false,        // Use 'true' in production (requires HTTPS)
            sameSite: 'strict',  // Optional: helps prevent CSRF
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
    }
}