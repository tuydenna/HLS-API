import {Readable} from "node:stream";
import sharp, {Sharp} from "sharp";
import SysLog from "@lib/logger/sys-log";
import ErrorException from "@config/error/error-exception";
import path from "path";
import mime from 'mime-types';
import {Injectable} from "express-router-controller-khmer";

@Injectable()
export default class ImageTransformService {

    async compressFile(file: Buffer<ArrayBuffer> | Readable): Promise<[Buffer<ArrayBuffer>, number]> {
        let compressed:  Buffer<ArrayBuffer>;
        try {
            if (file instanceof Readable) {
                const compressor: Sharp = this.transform();
                compressed = await file.pipe(compressor).toBuffer();
            } else {
                compressed = await this.transform(file).toBuffer();
            }
            SysLog.success("file compression", "success");
            return [compressed, compressed.length];
        } catch (error) {
            SysLog.error("file compression", error);
            throw new ErrorException("file compression", error.code || ErrorException.NOT_FOUND_CODE);
        }
    }

    private transform(file?: Buffer<ArrayBuffer>): Sharp {
        const params: any[] = [{ failOn: "none" }];
        if (file) {
            params.unshift(file);
        }
        return sharp(...params)
            .rotate()
            .resize({
                width: 1200,
                height: 1200,
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({
                quality: 80,
                effort: 4,
            })
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

     getFileContentType(filePath: string): string {
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

     isBase64File(value: string): boolean {
        if (typeof value !== "string") return false;
        return /^data:[^;]+;base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
    }
}