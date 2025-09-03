import cores from "cors";
import SysLog from "@lib/logger/sys-log";

export function coresMiddleware() {
    return cores({
        origin: function (url, cb) {
            const whiteList = ["http://localhost:3000", "http://192.168.18.8:3000", "http://139.99.54.113:3000"]
            if (whiteList.indexOf(url) === -1 && url) {
                return cb(new Error("Origin is not a valid URL"));
            }
            SysLog.error("[coresMiddleware]", url);
            return cb(null, true);
        } ,
        credentials: true
    })
}
