import {Request, Response} from "express";
import {Prefix, Post, Res, Req} from "express-router-controller-khmer";
import fs, {WriteStream} from "fs";
import {
	generateVideoDirPath,
	getFilePath,
	getStorageLink,
} from "@constant/path";
import ResBaseController from "@controllers/ResBaseController";
import SysLog from "@lib/logger/sys-log";
import FileManagerService from "@services/FileManagerService";
import {FolderType} from "@interfaces/file.type";
import {getEnv} from "@utils/index";
import db from "@lib/prisma/db-connector";
import ErrorException from "@config/error/error-exception";

@Prefix('/api/files')
export default class FileManagerController extends ResBaseController{

	constructor(
		private fileManagerService: FileManagerService
		) {
		super();
	}

	@Post("/thumbnails")
	async uploadThumbnail(@Req() req: Request, @Res() res: Response): Promise<any> {
		try {
			return await this.fileManagerService.uploadReqStream(req, FolderType.Thumbnails);
		} catch (e) {
			SysLog.error("[File Upload]", e);
			return this.resError(res, e);
		}
	}

	@Post("/avatars")
	async uploadAvatar(@Req() req: Request, @Res() res: Response): Promise<any> {
		try {
			return await this.fileManagerService.uploadReqStream(req, FolderType.Avatars);
		} catch (e) {
			SysLog.error("[File Upload]", e);
			return this.resError(res, e);
		}
	}

	@Post("/videos")
	async uploadVideoStream(@Req() req: Request, @Res() res: Response): Promise<any> {
		const outputDir: string = generateVideoDirPath();
		const fullOutputDir: string = getStorageLink(outputDir);
		const {src, fileName} = getFilePath(req, outputDir, "original" );

		// try {
		// 	if (!StorageEngine.isExist(fullOutputDir)) {
		// 		StorageEngine.mkDir(fullOutputDir);
		// 		await this.writeStream(req, src);
		// 		const file= await db.file.create({
		// 			data: {
		// 				dirPath: outputDir,
		// 				filePath: fileName,
		// 				size: Number(req.header("File-Size")),
		// 			}
		// 		})
		// 		return this.resSuccess(res, file);
		// 	}
		// } catch (e) {
		// 	SysLog.error("[File Upload]", e);
		// 	if (StorageEngine.isExist(fullOutputDir)) {
		// 		fs.rm(src, function (err) {
		// 			if (!err) {
		// 				fs.rmSync(fullOutputDir, {recursive: true, force: true});
		// 			}
		// 		})
		// 	}
		// 	return this.resError(res, e);
		// }
		try {
			const response = await fetch(getEnv("VIDEO_OPERATOR_API") + "/files/upload", {
				headers: {
					"Content-Type": req.header("Content-Type") || "application/octet-stream",
					"Content-Length": req.header("Content-Length"),
					"File-Extension": req.header("File-Extension") || "mp4",
					"File-Name": fileName,
				},
				method: "POST",
				body: req,
				duplex: "half",
			} as any);

			if (!response.ok) {
				throw new ErrorException("Error uploading file");
			}

			const file= await db.file.create({
				data: {
					dirPath: outputDir,
					filePath: fileName,
					size: Number(req.header("File-Size")),
				}
			})
			return this.resSuccess(res, file);
		} catch (e) {
			SysLog.error("[File Upload]", e);
			return this.resError(res, e);
		}
	}

	private writeStream(req: Request, src: string): Promise<boolean> {
		return new Promise((res, rej) => {
			console.log( "writeStream", src);
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

