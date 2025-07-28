class SysLog {
    success(label: string, msg: string) {
        console.log("\x1b[32m", label+":", "\x1b[0m", msg);
    }

    error(label: string, msg: string, ...others) {
        console.log("\x1b[31m", label+":", "\x1b[0m", msg, ...others);
    }
}

export default new SysLog();