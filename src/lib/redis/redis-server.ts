import {RedisClientType, createClient} from "redis";
import {getEnv} from "@utils/index";
import SysLog from "@lib/logger/sys-log";

export default class RedisServer {
    static client: RedisClientType;
    constructor() {
        RedisServer.client = createClient({
            socket: {
                host: getEnv("REDIS_HOST"),
                port: +getEnv("REDIS_PORT"),
                connectTimeout: 100,
                reconnectStrategy: false
                // reconnectStrategy: retries => {
                // 	console.warn(`Reconnecting to Redis (${retries})...`);
                // 	return Math.min(retries * 100, 3000); // Delay in ms
                // }
            },
            password: getEnv("REDIS_PASSWORD")
        });
    }

    async connect(): Promise<RedisClientType> {
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


