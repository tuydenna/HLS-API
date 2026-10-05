import {Request} from "express";
import {
    avatar_path,
    generateVideoDirPath,
    getFilePath,
    getFilePathInfo,
    thumbnail_path,
    video_path
} from "@constant/path";
import SysLog from "@lib/logger/sys-log";
import FileService from "@services/FileService";
import {FileCompressionResult, FolderType} from "@interfaces/file.type";
import ImageTransformService from "@services/ImageTransformService";
import {Inject} from "express-router-controller-khmer";
import {CircuitBreaker, getEnv, retry} from "@utils/index";
import ErrorException from "@config/error/error-exception";
import {File} from "@prisma/client";
import db from "@lib/prisma/db-connector";

export default class FileManagerService {
    @Inject()
    private readonly fileService: FileService;
    @Inject()
    private readonly imageTransformService: ImageTransformService;
    private fileServiceBreaker: CircuitBreaker = new CircuitBreaker();

    constructor() {}

    async uploadReqStream(req: Request, folderType: FolderType): Promise<any> {
        const dir: string = this.getStorageDirectory(folderType);
        const {fileName} = getFilePathInfo(dir, "webp");
        const [imageCompressed, size]: FileCompressionResult = await this.imageTransformService.compressFile(req);
        await this.fileServiceBreaker.call(() => retry(this.fileService.uploadStream.bind(this.fileService), fileName, imageCompressed))
        return {
            filePath: fileName,
            size
        };
    }

    async uploadChunkReqStream(req: Request): Promise<File> {
        req.headers["file-extension"] = req.header("file-extension") || "mp4";
        const outputDir: string = generateVideoDirPath();
        const {fileName} = getFilePath(req, outputDir, "original");
        const CHUNK_SIZE: number = 2 * 1024 * 1024;
        let buffer: Buffer<ArrayBuffer> = Buffer.alloc(0);
        const chunkAPI: string = getEnv("VIDEO_OPERATOR_API") + "/files/upload/chunks";

        for await (const chunk of req) {
            buffer = Buffer.concat([buffer, chunk]);
            SysLog.success("[S3 Service]", "chunk size: ", buffer.length);

            if (buffer.length >= CHUNK_SIZE) {
                const bufferChunk:  Buffer<ArrayBuffer> = buffer.subarray(0, CHUNK_SIZE);
                buffer = buffer.subarray(CHUNK_SIZE);

                SysLog.success("[S3 Service]", "uploading:", bufferChunk.length / (1024 * 1024), "MB");
                const response = await fetch(chunkAPI, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": bufferChunk.length.toString(),
                        "File-Name": fileName,
                    },
                    body: bufferChunk,
                }).then(res => res.json());

                if (response && response.code === ErrorException.INTERNAL_SERVER) {
                    throw new ErrorException(response.message || "stream chunking failed");
                }
            }
        }

        if (buffer.length > 0) {
            SysLog.success("[S3 Service]", "remaining:", buffer.length / (1024 * 1024), "MB");
            const response = await fetch(chunkAPI, {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                    "Content-Length": buffer.length.toString(),
                    "File-Name": fileName,
                },
                body: buffer,
            }).then(res => res.json());

            if (response && response.code === ErrorException.INTERNAL_SERVER) {
                throw new ErrorException(response.message || "stream chunking failed");
            }
        }

        const file: File = await db.file.create({
            data: {
                dirPath: outputDir,
                filePath: fileName,
                size: Number(req.header("File-Size")),
            }
        })

       return file;
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

