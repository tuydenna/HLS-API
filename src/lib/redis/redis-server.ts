import Redis from "ioredis";
import {getEnv} from "@utils/index";
import SysLog from "@lib/logger/sys-log";

export default class RedisServer {
    static client: Redis;
    constructor() {
        const host: string = getEnv("REDIS_HOST");
        const port: number = +getEnv("REDIS_PORT") || 6379;
        const user: string = getEnv("REDIS_USERNAME") || "default";
        const password: string = getEnv("REDIS_PASSWORD");
        // @ts-ignore
        RedisServer.client = new Redis({
            username: user,
            host,
            port,
            password,
            tls: host
        });
    }

    async connect(): Promise<void> {
        try {
            RedisServer.client.on("connect", () => {
                SysLog.success("[Redis Service]🔴",  "connected successfully.");
            });

            RedisServer.client.on("error", (err: Error & {code: string}) => {
                SysLog.error("[Redis Service]🔴", "Failed to connect Redis Service!", err.code);
            });
            return await RedisServer.client.connect();
        } catch(error) {
        }
    }
}


