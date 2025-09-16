import { Request, Response } from 'express';
import db from "@lib/prisma/db-connector";
import {Put, Get, Post, Prefix, Res, Req, Body} from "express-router-controller-khmer";
import UserService from "@services/UserService";
import ResBaseController from "@controllers/ResBaseController";
import fs, {WriteStream} from "fs";
import storageEngine from "@services/StorageEngine";
import {avatar_path, getFilePath, getStorageLink} from "@constant/path";
import {User} from "@prisma/client";
import SysLog from "@lib/logger/sys-log";

@Prefix("/api/users")
export default class UserController extends ResBaseController {

	private readonly service: UserService = new UserService();

	@Get('/')
	//@AuthMiddleware()
	async getAllUsers(@Res() res: Response) {
		return res.send(await db.user.findMany());
	}

	@Get('/:id')
	getUserById(req: Request, res: Response) {
		const userId = req.params.id;
		res.send(`Get user with ID: ${userId}`);
	}
	
	@Post('/')
	async create(req: Request, res: Response) {
		return this.resSuccess(res,  await this.service.create(req.body));
	}

	@Put('/:id')
	async update(@Body() data, @Req() req: Request, @Res() res: Response) {
		try {
			const userId: string = req.params.id;
			const user: User = await db.user.findFirst({
				where: { id: userId }
			});

			req.headers["file-extension"] = "png";

			const {src, fileName} = getFilePath(req, avatar_path);
			const updatedUser: User = await new Promise((resolve, reject) =>  {
				const writeStream: WriteStream = fs.createWriteStream(src);
				writeStream.write(Buffer.from(data.file.replace("data:image/png;base64,", ""), "base64"));
				writeStream.end()

				writeStream.on("finish", async () => {
					if (fs.existsSync(getStorageLink(user.avatar))) {
						storageEngine.remove(getStorageLink(user.avatar));
					}
					await db.user.update({
						where: {id: userId},
						data: {avatar: fileName}
					});
					user.avatar = fileName;
					resolve(user);
				});
			})
			return this.resSuccess(res, updatedUser);
		} catch (error) {
			SysLog.error("[update users]", error);
			this.resError(res, error)
		}
	}
}
