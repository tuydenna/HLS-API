import fs, {RmOptions} from "fs";
import path from "path";

function remove(path: string, options?: RmOptions) {
	if (isExist(path)) {
		return fs.rmSync(path, options);
	}
}

function joinPath(...paths: string[]): string {
	return path.join(...paths)
}

function mkDir(path: fs.PathLike, options: RmOptions = {recursive: true}): string {
	return fs.mkdirSync(path, options);
}

function isExist(path: fs.PathLike): boolean {
	return fs.existsSync(path);
}

export default {remove, joinPath, isExist, mkDir};