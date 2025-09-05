class SysLog {
    success(label: string, msg: any, ...others) {
        console.log("\x1b[32m", label+":", "\x1b[0m", msg, ...others);
    }

    error(label: string, msg: any, ...others) {
        console.log("\x1b[31m", label+":", "\x1b[0m", msg, ...others);
    }
}

export default new SysLog();