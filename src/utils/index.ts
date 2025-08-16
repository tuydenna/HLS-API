import * as process from "node:process";

function getEnv(key: string): string {
    try{
        return process.env[key];
    } catch (e) {
        console.error(`[${key}]: not found env`);
        return "";
    }
}

function isWindowOS(): boolean {
    return process.platform === "win32";
}

export {getEnv, isWindowOS};