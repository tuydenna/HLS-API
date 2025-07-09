import {RedisClientType, createClient} from "redis";
import {getEnv} from "@utils/index";

export default class RedisServer {
    static client: RedisClientType;
    constructor() {
        RedisServer.client = createClient({
            socket: {
                host: getEnv("REDIS_HOST"),
                port: +getEnv("REDIS_PORT"),
                connectTimeout: 10000,
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
        RedisServer.client.on("connect", () => {
            console.log("🔴 [Redis]: Redis server is connected!");
        });

        RedisServer.client.on("error", (err: Error) => {
            console.error("🔴 [Redis]: Redis server error!", err);
        });
        return await RedisServer.client.connect();
    }
}


