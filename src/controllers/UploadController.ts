import {Post, Prefix} from "../config/ExpressMethod";
import * as crypto from "crypto";
import {Request, Response} from "express";
import JSONDB from "../services/JSONDB";
import StorageEngine from "../services/StorageEngine";
import {Get} from "express-router-controller-khmer";
import multer from "multer";
import fs from "fs";
import {storage_path, video_path} from "../constant/path";
import db from "../config/database/db";
import {faker} from "@faker-js/faker";



@Prefix('')
export default class UploadController {
	@Get('/upload')
	view(req: Request, res: Response): any {
		res.render("upload-form");
	}
	
	@Post('/api/upload/video')
	 uploadVideoStream(req: Request, res: Response): any {
		const {src, fileName}   = this.getFilePath(req);
		try {
			const file= fs.createWriteStream(src);
			req.on("data", function (chunk) {
				file.write(chunk);
			});
			req.on("end", async(err) => {
				try {
					const file = await db.file.create({
						data: {
							path: fileName,
							size: Number(req.header("File-Size")),
							title: decodeURI(req.header("File-Name"))
						}
					})
					res.send({data: file, message: "Upload Success ✅✅✅✅✅✅😊😊😊😎😎"})
				} catch (e) {
					StorageEngine.remove(src);
					res.send({message: "Upload Failed ✅✅✅✅✅✅😊😊😊😎😎"});
				}
			});
		} catch (e) {
			StorageEngine.remove(src);
			throw e;
		}
	}
	
	@Post('/api/upload/content')
	async uploadContent(req, res: Response): any {
		StorageEngine.uploadThumbnail(req, res, async function (err) {
			if (err instanceof multer.MulterError) {
				res.status(500).send({message: err});
			} else if (err) {
				res.status(500).send({message: err});
			}
			const data = req.body;
			const post = await db.post.create({
				data: {
					title: data.title,
					authorId: "66b451c5de117af4a221d512",
					description: data.description,
					slug: faker.commerce.productName(),
					thumbnail: req.file.path,
					videoId: data.videoId
				}
			})
			res.send({data: post})
		})
	}
	
	private getFilePath(req: Request) {
		const fileName = video_path + crypto.randomUUID() +"."+ req.header("file-extension");
		return  {src: storage_path + fileName, fileName};
	}
};

