import ResBaseController from "@controllers/ResBaseController";
import {Post, Prefix, Put} from "express-router-controller-khmer";
import {User} from "@prisma/client";
import UserService from "@services/UserService";
import {Response, Request} from "express";
import AuthService from "@services/AuthService";

@Prefix("/api/authentications")
export default class AuthController extends ResBaseController {
    private readonly service: AuthService = new AuthService();
    private readonly userService: UserService = new UserService();

    @Post("/login")
    async login(req: Request, res: Response) {
        return this.resSuccess(res, await this.service.login(req.body))
    }

    @Post("/register")
    async register(req: Request, res: Response) {
        console.log("/register", req.body);
        try {
            const user: User = await this.userService.create(req.body)
            res.cookie('auth_token', user.token, {
                httpOnly: true,
                secure: false,        // Use 'true' in production (requires HTTPS)
                sameSite: 'strict',  // Optional: helps prevent CSRF
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });
            return this.resSuccess(res, user)
        } catch (e) {
            return this.resError(res, e.message);
        }
    }

    @Put("/logout")
    logout(req: Request, res: Response) {
        res.clearCookie('auth_token');
        return this.resSuccess(res, "")
    }
}