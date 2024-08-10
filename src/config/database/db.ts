import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

db.$connect()
	.then(db=> {
		console.log("DB connected ", db);
	}).catch(e=> {
	console.log("DB error connection ", e);
})

export default db;