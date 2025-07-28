import { PrismaClient } from '@prisma/client'
import SysLog from "@lib/logger/sys-log";

const db = new PrismaClient();

(async function () {
    try {
        await db.$connect()
        SysLog.success("[Database Connector]", "connected successfully.");
    } catch (e) {
        console.error("[Database Connector]:", "connection error.", e);
    }
})()

export default db;