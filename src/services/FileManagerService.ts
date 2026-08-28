import {Request} from "express";
import {avatar_path, getFilePathInfo, thumbnail_path, video_path} from "@constant/path";
import SysLog from "@lib/logger/sys-log";
import FileService from "@services/FileService";
import {FileCompressionResult, FolderType} from "@interfaces/file.type";
import ImageTransformService from "@services/ImageTransformService";
import {Inject} from "express-router-controller-khmer";

export default class FileManagerService {
    @Inject()
    private readonly fileService: FileService;
    @Inject()
    private readonly imageTransformService: ImageTransformService;

    constructor() {
    }

    async uploadReqStream(req: Request, folderType: FolderType): Promise<any> {
        const dir: string = this.getStorageDirectory(folderType);
        const {fileName} = getFilePathInfo(dir, "webp");
        try {
            const [imageCompressed, size]: FileCompressionResult = await this.imageTransformService.compressFile(req);
            await this.fileService.uploadStream(fileName, imageCompressed);

            return {
                filePath: fileName,
                size
            };
        } catch (e) {
            SysLog.error("[File Upload]", e);
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

