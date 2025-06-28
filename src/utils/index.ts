function getEnv(key: string): string {
    try{
        return process.env[key];
    } catch (e) {
        console.error(`[${key}]: not found env`);
        return "";
    }
}

export {getEnv};