import { PrismaClient } from '@prisma/client'

const db = new PrismaClient();

(async function () {
    try {
        await db.$connect()
        console.log("[Database Connector]:", "connected successfully.");
    } catch (e) {
        console.warn("[Database Connector]:", "connection error.", e);
    }
})()

export default db;