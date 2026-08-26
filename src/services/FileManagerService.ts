import {Request} from "express";
import {avatar_path, getFilePathInfo, thumbnail_path, video_path} from "@constant/path";
import SysLog from "@lib/logger/sys-log";
import FileService from "@services/FileService";
import {FileCompressionResult, FolderType} from "@interfaces/file.type";

export default class FileManagerService {
    private readonly fileService: FileService;
    constructor(fileService: FileService) {
        this.fileService = new FileService();
    }

    async uploadReqStream(req: Request, folderType: FolderType): Promise<any> {
        const dir: string = this.getStorageDirectory(folderType);
        const {fileName} = getFilePathInfo(dir, "webp");
        try {
            const [imageCompressed, size]: FileCompressionResult = await this.fileService.compressFile(req);
            await this.fileService.uploadStream(fileName, imageCompressed);

            return {
                filePath: fileName,
                size
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

