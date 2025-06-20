import {Post, Prefix} from "../config/ExpressMethod";
import * as crypto from "crypto";
import {Request, Response} from "express";
import StorageEngine from "../services/StorageEngine";
import {Get} from "express-router-controller-khmer";
import multer from "multer";
import fs, {WriteStream} from "fs";
import {storage_path, thumbnail_path, video_path} from "../constant/path";
import db from "../config/database/db";
import {faker} from "@faker-js/faker";
import {User} from "@prisma/client";

@Prefix('/api/files')
export default class UploadController {
	@Get('/upload')
	view(req: Request, res: Response): any {
		res.render("upload-form");
	}

	@Post("/thumbnail")
	async uploadThumbnail(req: Request, res: Response): Promise<any> {
		const {src, fileName} = this.getFilePath(req, thumbnail_path);
		try {
			await this.writeStream(req, src);
			res.send({data:  {dir_path: fileName, size: Number(req.header("File-Size")),}, message: "Upload Success ✅✅✅✅✅✅😊😊😊😎😎"})
		} catch (e) {
			console.log(e);
			StorageEngine.remove(src);
			res.status(500).send({message: e.message});
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
			res.send({data: file, message: "Upload Success ✅✅✅✅✅✅😊😊😊😎😎"})
		} catch (e) {
			console.log(e);
			StorageEngine.remove(src);
			res.status(500).send({message: e.message});
		}
	}
	
	@Post("/upload")
	 uploadVideoStreamv2(req: Request, res: Response): any {
		const {src, fileName}   = this.getFilePath(req, video_path);
		try {
			const file= fs.createWriteStream(src);
			req.on("data", function (chunk) {
				file.write(chunk);
			});
			req.on("end", async(err) => {
				try {
					const file = await db.file.create({
						data: {
							dir_path: fileName,
							size: Number(req.header("File-Size")),
						}
					})
					res.send({data: file, message: "Upload Success ✅✅✅✅✅✅😊😊😊😎😎"})
				} catch (e) {
					console.log(e);
					StorageEngine.remove(src);
					res.send({message: "Upload Failed ✅✅✅✅✅✅😊😊😊😎😎"});
				}
			});
		} catch (e) {
			StorageEngine.remove(src);
			console.log(e);
			throw e;
			res.statusCode = 404;
			res.send(e)
		}
	}
	
	@Post('/api/upload/content')
	async uploadContent(req, res: Response) {
		try {
			StorageEngine.uploadThumbnail(req, res, async function (err) {
				if (err instanceof multer.MulterError) {
					res.status(500).send({message: err});
				} else if (err) {
					res.status(500).send({message: err});
				}
				const data = req.body;
				console.log(req.file);
				const auth: User = await db.user.create({
					data: {
						name: faker.person.fullName(),
						email: faker.internet.email(),
						address: {
							zip: faker.location.zipCode(),
							street: faker.location.street(),
							city: faker.location.city(),
							state: faker.location.state()
						}}
				}) as User;
				const post = await db.post.create({
					data: {
						title: data.title,
						description: data.description,
						authorId: auth.id,
						slug: faker.commerce.productName(),
						thumbnail: "/thumbnail/"+req.file.filename,
						videoId: data.videoId
					}
				})
				res.send({data: post})
			})
		} catch (e) {
			return Error(e)
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

