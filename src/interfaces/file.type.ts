import {Readable} from "node:stream";

export enum FolderType {
    Avatars,
    Thumbnails,
    Videos
}

export type FileUploadInput = Buffer<ArrayBuffer> | Readable;
export type FileCompressionResult = [FileUploadInput, number];
