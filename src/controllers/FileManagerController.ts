import {Request, Response} from "express";
import StorageEngine from "@services/StorageEngine";
import {Prefix, Post, Res, Req, Body} from "express-router-controller-khmer";
import fs, {WriteStream} from "fs";
import {
	avatar_path,
	generateVideoDirPath,
	getFilePath,
	getStorageLink,
	thumbnail_path,
} from "@constant/path";
import db from "@lib/prisma/db-connector";
import ResBaseController from "@controllers/ResBaseController";
import SysLog from "@lib/logger/sys-log";
import FileService from "@services/FileService";

@Prefix('/api/files')
export default class FileManagerController extends ResBaseController{

	constructor(private fileService: FileService) {
		super();
	}

	@Post("/thumbnails")
	async uploadThumbnail(@Req() req: Request, @Res() res: Response): Promise<any> {
		if (!StorageEngine.isExist(getStorageLink(thumbnail_path))) {
			StorageEngine.mkDir(getStorageLink(thumbnail_path));
		}
		const {src, fileName} = getFilePath(req, thumbnail_path);
		try {
			console.log(src, fileName);
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
		const outputDir: string = generateVideoDirPath();
		const fullOutputDir: string = getStorageLink(outputDir);
		const {src, fileName} = getFilePath(req, outputDir, "original" );

		try {
			if (!StorageEngine.isExist(fullOutputDir)) {
				StorageEngine.mkDir(fullOutputDir);
				await this.writeStream(req, src);
				const file= await db.file.create({
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
			if (StorageEngine.isExist(fullOutputDir)) {
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
		if (!StorageEngine.isExist(getStorageLink(avatar_path))) {
			StorageEngine.mkDir(getStorageLink(avatar_path));
		}
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

	@Post("/migrate-storages")
	async migrateStorage(@Body() {dirPath}: any): Promise<any> {
		await this.fileService.migrateVideoToR2(dirPath, dirPath);
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

