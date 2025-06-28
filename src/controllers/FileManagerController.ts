import * as crypto from "crypto";
import {Request, Response} from "express";
import StorageEngine from "@services/StorageEngine";
import {Prefix, Post} from "express-router-controller-khmer";
import fs, {WriteStream} from "fs";
import {avatar_path, storage_path, thumbnail_path, video_path} from "@constant/path";
import db from "@config/database/db";
import ResBaseController from "@controllers/ResBaseController";

@Prefix('/api/files')
export default class FileManagerController extends ResBaseController{

	@Post("/thumbnail")
	async uploadThumbnail(req: Request, res: Response): Promise<any> {
		const {src, fileName} = this.getFilePath(req, thumbnail_path);
		try {
			await this.writeStream(req, src);
			return this.resSuccess(res, {dir_path: fileName, size: Number(req.header("File-Size"))});
		} catch (e) {
			console.warn("[File Upload]: ", e);
			StorageEngine.remove(src);
			return this.resError(res, e.message);
		}
	}

	@Post("/video")
	async uploadVideoStream(req: Request, res: Response): Promise<any> {
		const {src, fileName} = this.getFilePath(req, video_path);
		try {
			await this.writeStream(req, src);
			const file = await db.file.create({
				data: {
					dir_path: fileName,
					size: Number(req.header("File-Size")),
				}
			})
			return this.resSuccess(res, file);
		} catch (e) {
			console.warn("[File Upload]: ", e);
			StorageEngine.remove(src);
			return this.resError(res, e.message);
		}
	}

	@Post("/avatar")
	async uploadAvatar(req: Request, res: Response): Promise<any> {
		const {src, fileName} = this.getFilePath(req, avatar_path);
		try {
			await this.writeStream(req, src);
			console.log("uploading avatar");
			return this.resSuccess(res, {dir_path: fileName, size: Number(req.header("File-Size"))});
		} catch (e) {
			console.warn("[File Upload]: ", e);
			StorageEngine.remove(src);
			return this.resError(res, e.message);
		}
	}

	
	private getFilePath(req: Request, folder: string) {
		const fileName = folder + crypto.randomUUID() +"."+ req.header("file-extension");
		return  {src: storage_path + fileName, fileName};
	}

	private writeStream(req: Request, src: string): Promise<boolean> {

		return new Promise((res, rej) => {
			const file: WriteStream= fs.createWriteStream(src);

			req.on("data", function (chunk) {
				file.write(chunk);
			});

			req.on("end", async() => {
				file.close();
				res(true)
			});

			file.on("error", (err) => {
				console.error("[write stream]:", err);
				rej(false)
			})
		})

	}
};

