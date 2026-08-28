import { Request, Response } from 'express';
import db from "@lib/prisma/db-connector";
import {Put, Get, Post, Prefix, Res, Req, Body, Inject} from "express-router-controller-khmer";
import UserService from "@services/UserService";
import ResBaseController from "@controllers/ResBaseController";
import {avatar_path, getFilePathInfo} from "@constant/path";
import {Prisma, User} from "@prisma/client";
import SysLog from "@lib/logger/sys-log";
import bcrypt from "bcryptjs";
import FileService from "@services/FileService";
import {FileCompressionResult} from "@interfaces/file.type";
import ImageTransformService from "@services/ImageTransformService";

@Prefix("/api/users")
export default class UserController extends ResBaseController {

	@Inject()
	private readonly service: UserService;
	@Inject()
	private readonly fileService: FileService;
	@Inject()
	private readonly imageTransformService: ImageTransformService;

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
	async update(@Body() data: {file: any, password: string}, @Req() req: Request, @Res() res: Response) {
		try {
			const userId: string = req.params.id;
			const password: string | undefined = data.password ?? data.password.trim();
			const user: User = await db.user.findFirst({
				where: { id: userId }
			});
			const updateUserInput: Prisma.UserUpdateInput = {};
			if (password) {
				updateUserInput.password = bcrypt.hashSync(password, 10);
			}

			const updatedUser: User = await new Promise(async (resolve, _reject) => {
				if (this.imageTransformService.isBase64File(data.file)) {
					const {rawBase64} = this.imageTransformService.getFileBase64Info(data.file);

					const {fileName} = getFilePathInfo(avatar_path, "webp");
					const imageStream: Buffer<ArrayBuffer> = Buffer.from(rawBase64, "base64");
					const [imageCompressed]: FileCompressionResult = await this.imageTransformService.compressFile(imageStream);

					await this.fileService.uploadFile(fileName, imageCompressed);
					await this.fileService.removeFile(user.avatar);

					updateUserInput.avatar = fileName;
					user.avatar = fileName;
				}
				resolve(user);
			});

			await this.service.update( {id: userId}, updateUserInput);
			return this.resSuccess(res, updatedUser);
		} catch (error) {
			SysLog.error("[update users]", error);
			this.resError(res, error)
		}
	}

}
