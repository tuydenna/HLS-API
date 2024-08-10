function getFileExt(file) {
	try {
		let fileExt = file.originalname.split(".");
		fileExt = fileExt[fileExt.length-1];
		return "."+fileExt;
	} catch (e) {
		throw ("File not valid!")
	}
}
export default {getFileExt};