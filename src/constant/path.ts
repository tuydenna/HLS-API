import path from "path";

const db_path = path.join(process.cwd() + "/src/database");
const storage_path   = path.join(process.cwd() + "/storages");
const video_path = "/videos";
const avatar_path = "/avatars";
const thumbnail_path = "/thumbnail";

function getStorageLink (...path: string[]): string {
    return `${storage_path}${path.join("")}`;
}

export {db_path, storage_path, video_path, thumbnail_path, avatar_path, getStorageLink};