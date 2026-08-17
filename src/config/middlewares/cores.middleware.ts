import cores from "cors";
import SysLog from "@lib/logger/sys-log";
import {getEnv} from "@utils/index";

export function coresMiddleware() {
    return cores({
        origin: function (url: string, cb: Function) {
            if (getEnv("NODE_ENV") !== "production" || !url) {
                return cb(null, true);
            }
            const whiteList: string[] = getEnv("CORS_ORIGIN")?.split(",") || [];
            if (whiteList.indexOf(url) === -1) {
                SysLog.error("[coresMiddleware]", url);
                return cb(new Error("Origin is not a valid URL"));
            }
            return cb(null, true);
        } ,
        credentials: true
    })
}
