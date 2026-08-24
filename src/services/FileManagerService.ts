import {Request} from "express";
import {avatar_path, getFilePath, thumbnail_path, video_path} from "@constant/path";
import SysLog from "@lib/logger/sys-log";
import FileService from "@services/FileService";
import {FolderType} from "@interfaces/file.type";

export default class FileManagerService {
    constructor(private fileService: FileService) {}

    async uploadReqStream(req: Request, folderType: FolderType): Promise<any> {
        const dir: string = this.getStorageDirectory(folderType);
        const {fileName} = getFilePath(req, dir);
        try {
            await this.fileService.uploadStream(fileName, req);
            return {
                filePath: fileName,
                size: Number(req.header("File-Size"))
            };
        } catch (e) {
            SysLog.error("[File Upload]", e);
            // StorageEngine.remove(src);
            throw e;
        }
    }

    private getStorageDirectory(folderType: FolderType): string {
        switch (folderType) {
            case FolderType.Avatars:
                return avatar_path;
            case FolderType.Thumbnails:
                return thumbnail_path;
            case FolderType.Videos:
                return video_path;
            default:
                return "/";
        }
    }
}

