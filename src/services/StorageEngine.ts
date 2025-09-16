import fs, {RmOptions} from "fs";
import path from "path";

function remove(path: string, options?: RmOptions) {
	return fs.rmSync(path, options);
}

function joinPath(...paths: string[]): string {
	return path.join(...paths)
}

function isExist(path: fs.PathLike): boolean {
	return fs.existsSync(path);
}

export default {remove, joinPath, isExist};