import RedisServer from "@lib/redis/redis-server";

async function redisSet(key: string, value: any) {
    return await RedisServer.client.set(key, value);
}

async function redisGet(key: string) {
    return await RedisServer.client.get(key);
}

async function redisSetExpire(key: string, expire: number, value: any) {
    try {
        return await RedisServer.client.setEx(key, expire, value);
    }catch (e) {
        console.log(e.code);
        throw e
    }
}

async function redisExist(key: string): Promise<boolean> {
    return Boolean(await RedisServer.client.exists(key));
}

export {redisGet, redisSet, redisSetExpire, redisExist}