import Redis from "ioredis";
import {getEnv} from "@utils/index";
import SysLog from "@lib/logger/sys-log";

export default class RedisServer {
    static client: Redis;
    constructor() {
        RedisServer.client = new Redis({
            host: getEnv("REDIS_HOST"),
            port: +getEnv("REDIS_PORT"),
            password: getEnv("REDIS_PASSWORD"),
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


