import * as process from "node:process";
import ErrorException from "@config/error/error-exception";
import SysLog from "@lib/logger/sys-log";

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

const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

async function retry<T extends (...args: any[]) => any>(fn: T, ...args: Parameters<T>): Promise<ReturnType<T>> {
    const maxRetries: number = 3;
    for (let attempt: number = 1; attempt <= maxRetries; attempt++) {
        try {
            SysLog.warn("[Retry Attempt]", attempt);
            return await fn(...args);
        } catch (error) {
            const code: number = error.code || 500;
            const message: string = error.message || "Service is unavailable!";
            if (code !== ErrorException.INTERNAL_SERVER || attempt === maxRetries) {
                SysLog.error(`[Retry(${attempt})]`, message, error);
                throw new ErrorException(message, code);
            }
            await sleep(1000);
        }
    }
}

class CircuitBreaker {
    private fn: Function;
    private readonly maxRetries: number = 3;
    readonly failureThreshold: number;
    private readonly resetTimeout: number;
    private failures: number;
    private state: "CLOSED" | "OPEN" | "HALF_OPEN";

    constructor(failureThreshold = 3, resetTimeout = 5000) {
        this.failureThreshold = failureThreshold;
        this.resetTimeout = resetTimeout;

        this.failures = 0;
        this.state = "CLOSED";
    }

    async call<T extends (...args: any[]) => any>(fn: T): Promise<Awaited<ReturnType<T>>> {
        this.fn = fn;
        // Circuit is OPEN → don't call service
        if (this.state === "OPEN") {
            throw new ErrorException("Service is unavailable!", ErrorException.INTERNAL_SERVER);
        }

        try {
            const result = await this.fn();

            // Success → reset failures
            this.failures = 0;

            return result;
        } catch (error) {
            this.failures++;

            SysLog.warn("[Service Breaker]", `Failure ${this.failures}`, error.message || error);

            if (this.failures >= this.failureThreshold) {
                this.state = "OPEN";

                SysLog.warn("[Service Breaker]", "state is OPEN");

                setTimeout(() => {
                    this.state = "HALF_OPEN";
                    SysLog.warn("[Service Breaker]", "state is HALF_OPEN");
                }, this.resetTimeout);
            }

            throw error;
        }
    }
}

export {getEnv, isWindowOS, retry, CircuitBreaker};