import cores from "cors";

export function coresMiddleware() {
    return cores({
        origin: function (url, cb) {
            const whiteList = ["http://localhost:3000"]
            if (whiteList.indexOf(url) === -1 && url) {
                return cb(new Error("Origin is not a valid URL"));
            }
            return cb(null, true);
        } ,
        credentials: true
    })
}