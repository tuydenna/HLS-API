import db from "@lib/prisma/db-connector";
import {File} from "@prisma/client";

export default class FileService {
	async getAll(filter = undefined) {
		return db.file.findMany({where: filter});
	}
	
	async getOne(id: string): Promise<File | null> {
		return db.file.findFirst({
			where: {id}
		});
	}
}