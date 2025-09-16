import * as crypto from "crypto";
import {Request, Response} from "express";
import StorageEngine from "@services/StorageEngine";
import {Prefix, Post, Res, Req} from "express-router-controller-khmer";
import fs, {WriteStream} from "fs";
import {avatar_path, getFilePath, storage_path, thumbnail_path, video_path} from "@constant/path";
import db from "@lib/prisma/db-connector";
import ResBaseController from "@controllers/ResBaseController";
import UserService from "@services/UserService";
import {User} from "@prisma/client";
import SysLog from "@lib/logger/sys-log";

@Prefix('/api/files')
export default class FileManagerController extends ResBaseController{

	@Post("/thumbnails")
	async uploadThumbnail(@Req() req: Request, @Res() res: Response): Promise<any> {
		const {src, fileName} = getFilePath(req, thumbnail_path);
		try {
			await this.writeStream(req, src);
			return this.resSuccess(res, {filePath: fileName, size: Number(req.header("File-Size"))});
		} catch (e) {
			SysLog.error("[File Upload]", e);
			StorageEngine.remove(src);
			return this.resError(res, e);
		}
	}

	@Post("/videos")
	async uploadVideoStream(@Req() req: Request, @Res() res: Response): Promise<any> {
		const user: User = await new UserService().getOne(req["auth"].id);
		const outputDir: string = video_path + user.userDir + "/" + crypto.randomUUID()
		const fullOutputDir: string = storage_path + outputDir;
		const {src, fileName} = getFilePath(req, outputDir, "original" );

		try {
			if (!fs.existsSync(fullOutputDir)) {
				fs.mkdirSync(fullOutputDir, {recursive: true});
				await this.writeStream(req, src);
				const file = await db.file.create({
					data: {
						dirPath: outputDir,
						filePath: fileName,
						size: Number(req.header("File-Size")),
					}
				})
				return this.resSuccess(res, file);
			}
		} catch (e) {
			SysLog.error("[File Upload]", e);
			if (fs.existsSync(fullOutputDir)) {
				fs.rm(src, function (err) {
					if (!err) {
						fs.rmSync(fullOutputDir, {recursive: true, force: true});
					}
				})
			}
			return this.resError(res, e);
		}
	}

	@Post("/avatars")
	async uploadAvatar(@Req() req: Request, @Res() res: Response): Promise<any> {
		const {src, fileName} = getFilePath(req, avatar_path);
		try {
			await this.writeStream(req, src);
			console.log("uploading avatar");
			return this.resSuccess(res, {filePath: fileName, size: Number(req.header("File-Size"))});
		} catch (e) {
			SysLog.error("[File Upload]", e);
			StorageEngine.remove(src);
			return this.resError(res, e);
		}
	}
	private writeStream(req: Request, src: string): Promise<boolean> {

		return new Promise((res, rej) => {
			// req.on("data", function (chunk) {

			// 	file.write(chunk);
			// });
			const file: WriteStream= fs.createWriteStream(src);
			req.pipe(file)

			req.on("end", async() => {
				// SysLog.success("[writeStream]", "is end.");
				file.end();
			});

			req.on("error", () => {
				SysLog.success("[writeStream]", "is error.", src);
				file.destroy();
				rej("client is aborting stream");
			})

			file.on("error", (err) => {
				SysLog.error("[writeStream]", "is errored.", src);
				file.destroy()
				rej("file stream is error");
			})

			file.on("finish", () => {
				SysLog.success("[writeStream]", "file stream is finished", src);
				res(true);
			});
		})

	}
};

