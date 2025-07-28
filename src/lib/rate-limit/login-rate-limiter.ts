import {RateLimiterRedis} from "rate-limiter-flexible";
import ErrorException from "@config/error/error-exception";
import {Response, Request} from "express";
import {User} from "@prisma/client";
import {ILoginDto} from "@interfaces/dto/login";

export default class LoginRateLimiter {
    private readonly maxWrongAttemptsByIPperDay: number = 100;
    private readonly maxConsecutiveFailsByUsernameAndIP: number = 10;
    private readonly limiterSlowBruteByIP: RateLimiterRedis;
    private readonly limiterConsecutiveFailsByUsernameAndIP: RateLimiterRedis;

    constructor(redisClient: any) {
        this.limiterSlowBruteByIP = new RateLimiterRedis({
            storeClient: redisClient,
            keyPrefix: 'login_fail_ip_per_day',
            points: this.maxWrongAttemptsByIPperDay,
            duration: 60 * 60 * 24,
            blockDuration: 60 * 60 * 24, // Block for 1 day, if 100 wrong attempts per day
        });

        this.limiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
            storeClient: redisClient,
            keyPrefix: 'login_fail_consecutive_username_and_ip',
            points: this.maxConsecutiveFailsByUsernameAndIP,
            duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
            blockDuration: 60 * 60, // Block for 1 hour
        });
    }

    async use(data: ILoginDto, req: Request, res: Response, authorizeUserCallBack: Function): Promise<User> {
        const ipAddr: string = req.ip;
        const usernameIPkey: string = this.getUsernameIPkey(data.username, ipAddr);

        const [resUsernameAndIP, resSlowByIP] = await Promise.all([
            this.limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
            this.limiterSlowBruteByIP.get(ipAddr)
        ]);

        let retrySecs: number = 0;

        // Check if IP or Username + IP is already blocked
        if (resSlowByIP !== null && resSlowByIP.consumedPoints > this.maxWrongAttemptsByIPperDay) {
            retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
        } else if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > this.maxConsecutiveFailsByUsernameAndIP) {
            retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1;
        }

        if (retrySecs > 0) {
            res.set('Retry-After', String(retrySecs));
            throw new ErrorException("Too Many Requests", 429);
        } else {
            const user = await authorizeUserCallBack(data, res); // should be implemented in your project
            if (!user.isLoggedIn) {
                // Consume 1 point from limiters on wrong attempt and block if limits reached
                try {
                    const promises = [this.limiterSlowBruteByIP.consume(ipAddr)];
                    if (user.auth) {
                        // Count failed attempts by Username + IP only for registered users
                        promises.push(this.limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey));
                    }

                    await Promise.all(promises);
                    throw new ErrorException("email or password is wrong", 400);
                } catch (rlRejected) {
                    if (rlRejected instanceof Error) {
                        throw rlRejected;
                    } else {
                        // @ts-ignore
                        res.set('Retry-After', String(Math.round(rlRejected.msBeforeNext / 1000)) || 1);
                        throw new ErrorException("Too Many Requests", 429);
                    }
                }
            }

            if (user) {
                if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
                    // Reset on successful authorisation
                    await this.limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey);
                }
                return user.auth;
            }
        }
    }

    private getUsernameIPkey(username: string, ip: string) {
        return `${username}_${ip}`;
    };

}
