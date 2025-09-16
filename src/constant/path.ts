import path from "path";
import {Request} from "express";
import crypto from "crypto";

const db_path = path.join(process.cwd() + "/src/database");
const storage_path   = path.join(process.cwd() + "/storages");
const video_path = "/videos";
const avatar_path = "/avatars";
const thumbnail_path = "/thumbnail";

function getStorageLink (...path: string[]): string {
    return `${storage_path}${path.join("")}`;
}

function getFilePath(req: Request, folder: string, name: string = crypto.randomUUID()) {
    const fileName:string = folder +"/"+ name +"."+ req.header("file-extension");
    return  {src: storage_path + fileName, fileName};
}

export {db_path, storage_path, video_path, thumbnail_path, avatar_path, getStorageLink, getFilePath};