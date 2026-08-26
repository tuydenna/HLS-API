import db from "@lib/prisma/db-connector";
import {
    CompleteMultipartUploadCommandOutput, DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    GetObjectCommandOutput,
    ListObjectsV2Command, ListObjectsV2CommandOutput, ObjectIdentifier, PutObjectCommand,
    S3Client
} from '@aws-sdk/client-s3';
import {getEnv} from "@utils/index";
import mime from 'mime-types';
import fs from "fs";
import path from "path";
import {Upload} from '@aws-sdk/lib-storage';
import {File} from "@prisma/client"
import {storage_path} from "@constant/path";
import ErrorException from "@config/error/error-exception";
import {ReadStream} from "node:fs";
import {formatStorageFileKey} from "../helper/stream-helper";
import SysLog from "@lib/logger/sys-log";
import {Injectable} from "express-router-controller-khmer";
import { Readable } from "node:stream";
import sharp, {Sharp} from "sharp";
import {FileCompressionResult, FileUploadInput} from "@interfaces/file.type";

@Injectable()
export default class FileService {
    readonly client: S3Client;
    private readonly bucketName: string;

    constructor() {
        const accountId: string = process.env.CLOUDFLARE_ACCOUNT_ID;
        const accessKeyId: string = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey: string = process.env.R2_SECRET_ACCESS_KEY;
        this.bucketName = getEnv("R2_BUCKET_NAME");

        if (!accountId || !accessKeyId || !secretAccessKey) {
            throw new Error('Missing Cloudflare R2 environment variables.');
        }

        this.client = new S3Client({
            region: 'auto', // Cloudflare R2 uses 'auto' for the region
            endpoint: `https://1cade9413aad33353af7d4402075c34e.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    async getOne(id: string): Promise<File | null> {
        // @ts-ignore
        return db.file.findFirst({
            where: {id}
        }) as Promise<File | null>;
    }

    async getAll(filter = undefined) {
        return db.file.findMany({where: filter});
    }

    async uploadFile(fileKey: string, file: FileUploadInput): Promise<GetObjectCommandOutput> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: formatStorageFileKey(fileKey),
                Body: file,
                ContentType: this.getFileContentType(fileKey),
                CacheControl: this.getObjectCacheControl()
            });

            const response: GetObjectCommandOutput = await this.client.send(command);
            console.log(response);
            if (response.$metadata.httpStatusCode !== ErrorException.SUCCESS) {
                throw new ErrorException("File upload error", ErrorException.BAD_REQUEST_CODE);
            }
            return response;
        } catch (error) {
            SysLog.error("File upload", error);
            throw new ErrorException(error.message || "File removal error", error.code);
        }
    }

    async removeFile(fileKey: string): Promise<GetObjectCommandOutput> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: formatStorageFileKey(fileKey),
            });

            const response: GetObjectCommandOutput = await this.client.send(command);
            console.log("removeFile", response);
            if(![ErrorException.SUCCESS, 204].includes(response.$metadata.httpStatusCode)) {
                throw new ErrorException("File removal error", ErrorException.BAD_REQUEST_CODE);
            }
            return response;
        } catch (error) {
            SysLog.error("File removal", error);
            throw new ErrorException(error.message || "File removal error", error.code);
        }
    }

    async uploadStream(fileKey: string, fileStream: Buffer<ArrayBuffer> | Readable): Promise<GetObjectCommandOutput> {
        try {
            const upload = new Upload({
                client: this.client,
                params: {
                    Bucket: this.bucketName,
                    Key: formatStorageFileKey(fileKey),
                    Body: fileStream,
                    ContentType: this.getFileContentType(fileKey),
                    CacheControl: this.getObjectCacheControl()
                },
            });

            const response: CompleteMultipartUploadCommandOutput = await upload.done();
            if (response.$metadata.httpStatusCode !== ErrorException.SUCCESS) {
                throw new ErrorException("File upload error", ErrorException.BAD_REQUEST_CODE);
            }
            return response;
        } catch (error) {
            SysLog.error("File removal", error);
            throw new ErrorException(error.message || "File removal error", error.code);
        }
    }

    async downloadFile(fileKey: string): Promise<GetObjectCommandOutput> {

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: formatStorageFileKey(fileKey),
            });

            const response: GetObjectCommandOutput = await this.client.send(command);

            if (!response.Body || response.$metadata.httpStatusCode === 404) {
                throw new ErrorException("File not found", ErrorException.NOT_FOUND_CODE);
            }
            return response;
        } catch (error) {
            if (error.Code === "NoSuchKey") {
                console.log("file not found");
                throw new ErrorException("File not found", ErrorException.NOT_FOUND_CODE);
            }
            throw new ErrorException(error.Code);
        }
    }

	async deleteDir(dirKey: string): Promise<void> {
		try {
			let prefix: string = formatStorageFileKey(dirKey);
			prefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

			console.log(`Starting deletion of folder prefix: "${prefix}" in bucket "${this.bucketName}"...`);

			let isTruncated: boolean = true;
			let continuationToken: string | undefined;
			let totalDeleted: number = 0;

			while (isTruncated) {
				// 1. List objects under the specified prefix (up to 1,000 at a time)
				const listCommand = new ListObjectsV2Command({
					Bucket: this.bucketName,
					Prefix: prefix,
					ContinuationToken: continuationToken,
				});

				const listResponse: ListObjectsV2CommandOutput = await this.client.send(listCommand);
				const objects = listResponse.Contents;

				if (!objects || objects.length === 0) {
					console.log(`No objects found under prefix "${prefix}".`);
					break;
				}

				// 2. Map listed objects into DeleteObjects identifiers format
				const objectsToDelete: ObjectIdentifier[] = objects.map((obj) => ({
					Key: obj.Key!,
				}));

				// 3. Batch delete up to 1,000 objects in a single API request
				const deleteCommand = new DeleteObjectsCommand({
					Bucket: this.bucketName,
					Delete: {
						Objects: objectsToDelete,
						Quiet: true, // If true, R2 only returns errors in response (saves bandwidth)
					},
				});

				await this.client.send(deleteCommand);
				totalDeleted += objectsToDelete.length;
				console.log(`Deleted batch of ${objectsToDelete.length} objects... (Total: ${totalDeleted})`);

				// 4. Check if there are more objects remaining (pagination)
				isTruncated = listResponse.IsTruncated ?? false;
				continuationToken = listResponse.NextContinuationToken;
			}
			console.log(`✅ Successfully deleted folder "${prefix}" (${totalDeleted} total files removed).`);
		} catch (error) {
			SysLog.error("R2 delete", error);
			throw error;
		}
	}

    async migrateVideoToR2(
        localVideoDir: string,
        r2VideoPrefix: string,
        concurrency = 20 // Higher concurrency for many small .ts/.m4s files
    ): Promise<void> {
        r2VideoPrefix = formatStorageFileKey(r2VideoPrefix);
        const absoluteDir: string = path.join(storage_path, localVideoDir);
        const files: string[] = await this.getFilesRecursively(absoluteDir);

        console.log(`🚀 Found ${files.length} video chunks/manifests to upload...`);

        let completed: number = 0;
        const queue: string[] = [...files];

        const worker = async () => {
            while (queue.length > 0) {
                const filePath: string = queue.shift();
                if (!filePath) break;

                // Maintain internal folder structure (e.g., 1080p/index.m3u8)
                const relativePath: string = path.relative(absoluteDir, filePath);
                const normalizedPath: string = relativePath.split(path.sep).join('/');

                const r2ObjectKey: string = r2VideoPrefix
                    ? `${r2VideoPrefix.replace(/\/$/, '')}/${normalizedPath}`
                    : normalizedPath;

                const localFileStream: ReadStream = fs.createReadStream(filePath);
                const contentType: string = this.getFileContentType(filePath);

                // Disable caching on .m3u8 manifests during live streaming, allow long cache on segments
                const isManifest: boolean = filePath.endsWith('.m3u8') || filePath.endsWith('.mpd');
                const cacheControl: string = this.getObjectCacheControl(isManifest);

                const upload = new Upload({
                    client: this.client,
                    params: {
                        Bucket: this.bucketName,
                        Key: r2ObjectKey,
                        Body: localFileStream,
                        ContentType: contentType,
                        CacheControl: cacheControl,
                    },
                    queueSize: 1, // Keep memory low per file
                    partSize: 5 * 1024 * 1024,
                });

                try {
                    await upload.done();
                    completed++;
                    if (completed % 50 === 0 || completed === files.length) {
                        console.log(`Progress: [${completed}/${files.length}] chunks uploaded...`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to upload ${normalizedPath}:`, error);
                }
            }
        }

        // Spawn concurrent workers
        const workers = Array.from({length: Math.min(concurrency, files.length)}, () => worker());
        await Promise.all(workers);

        console.log(`✅ Successfully migrated video folder to R2 at: ${r2VideoPrefix}`);
    }

    // 2. Custom Video MIME Type Resolver
    private getFileContentType(filePath: string): string {
        const ext: string = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.m3u8':
                return 'application/x-mpegURL';
            case '.ts':
                return 'video/MP2T';
            case '.m4s':
                return 'video/iso.segment';
            case '.mpd':
                return 'application/dash+xml';
            default:
                return mime.lookup(filePath) || 'application/octet-stream';
        }
    }

    // 3. Helper to recursively list files
    private async getFilesRecursively(dir: string): Promise<string[]> {
        let results: string[] = [];
        const list = await fs.promises.readdir(dir, {withFileTypes: true});

        for (const entry of list) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const subFiles = await this.getFilesRecursively(fullPath);
                results = results.concat(subFiles);
            } else {
                results.push(fullPath);
            }
        }
        return results;
    }

    private getObjectCacheControl(isManifest: boolean = false): string {
        return isManifest
            ? 'max-age=0, no-cache, no-store'
            : 'public, max-age=31536000, immutable';
    }

    getFileBase64Info(base64: string) {
        const regex = /^data:([^;]+);base64,/;
        const match: RegExpMatchArray = base64.match(regex);
        const mimeToExt: Record<string, string> = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "image/gif": "gif",
            "video/mp4": "mp4",
            "audio/mpeg": "mp3",
        };

        if (match) {
            const mimeType: string = match[1];
            const extension: string = mimeToExt[mimeType];
            return {
                extension,
                mimeType: mimeType,
                rawBase64: base64.replace(regex, "")
            };
        }
        return {
            extension: "unknown",
            mimeType: "unknown",
            rawBase64: base64,
        }
    }

    async compressFile(file: Buffer<ArrayBuffer> | Readable): Promise<FileCompressionResult> {
        try {
            if (file instanceof Readable) {
                let size: number = 0;
                return await new Promise<FileCompressionResult>((resolve, reject) => {
                    const compressed: Sharp = sharp()
                        .resize({
                            width: 1200,
                            height: 1200,
                            fit: "inside",
                            withoutEnlargement: true,
                        })
                        .webp({
                            quality: 80,
                        })
                    compressed.on("data", (chunk) => {
                        if (chunk && chunk.length) {
                            size += chunk.length;
                        }
                    });
                    compressed.on("end", () => {
                        resolve([compressed, size]);
                    })
                    compressed.on("error", error => {
                        reject(error);
                        SysLog.error("file compression", error);
                    });
                    file.pipe(compressed);
                    SysLog.success("file compression", "success");
                });
            } else {
                const compressed: Buffer<ArrayBuffer> = await sharp(file)
                    .resize({
                        width: 1200,
                        height: 1200,
                        fit: "inside",
                        withoutEnlargement: true,
                    })
                    .webp({
                        quality: 80,
                    })
                    .toBuffer();
                SysLog.success("file compression", "success");
                return [compressed, compressed.length];
            }
        } catch (error) {
            SysLog.error("file compression", error);
            throw new ErrorException("file compression", error.code || ErrorException.NOT_FOUND_CODE);
        }
    }
}
