import * as process from "process";
import path from "path";

const db_path = path.join(process.cwd() + "/src/database");
const storage_path   = path.join(process.cwd() + "/storages");
const video_path   =   "/videos/";

export {db_path, storage_path, video_path};