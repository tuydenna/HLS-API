import ResBaseController from "@controllers/ResBaseController";
import {Post, Prefix, Put, Req} from "express-router-controller-khmer";
import {User} from "@prisma/client";
import UserService from "@services/UserService";
import {Response, Request} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {getEnv} from "@utils/index";
import {StringValue} from "ms";
import {Body, Res} from "express-router-controller-khmer";
import LoginRateLimiter from "@lib/rate-limit/login-rate-limiter";
import RedisServer from "@lib/redis/redis-server";
import {ILoginDto} from "@interfaces/dto/login";

@Prefix("/api/authentications")
export default class AuthController extends ResBaseController {
    private readonly userService: UserService = new UserService();

    @Post("/login")
    async login(@Body() data: ILoginDto, @Req() req: Request, @Res() res: Response) {
        try {
            const loginRateLimiter = new LoginRateLimiter(RedisServer.client);
            return this.resSuccess(res, await loginRateLimiter.use(data, req, res, this.authorizeUser.bind(this)));
        } catch (e) {
            return this.resError(res, e);
        }
    }

    @Post("/register")
    async register(@Body() data, @Res() res: Response) {
        try {
            const user: User = await this.userService.create(data);
            this.setHeaderAuthCookie(res, user.token);
            return this.resSuccess(res, user);
        } catch (e) {
            return this.resError(res, e);
        }
    }

    @Put("/logout")
    logout(@Req() req: Request, @Res() res: Response) {
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

    protected async authorizeUser(data: ILoginDto, res: Response): Promise<{
        isLoggedIn: boolean,
        auth: User | null
    }> {
        console.log("authorizeUser", data);
        console.log("DB URL", getEnv("DATABASE_URL"));
        const auth: User = await this.userService.getOneByUsername(data.username);
        console.log("authorizeUser", auth);
        if (!auth) {
            return {isLoggedIn: false, auth};
        }
        const isCorrectPass: boolean = await bcrypt.compare(data.password, auth.password);
        if (!isCorrectPass) {
            return {isLoggedIn: false, auth};
        }

        const token: string = jwt.sign({authId: auth.id}, getEnv("JWT_SECRET") || "", {expiresIn: getEnv("JWT_EXPIRE_IN") as StringValue});

        await this.userService.update({id: auth.id}, {token});
        this.setHeaderAuthCookie(res, token);
        return {isLoggedIn: true, auth};
    }
}