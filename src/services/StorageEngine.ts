import fs, {RmOptions} from "fs";
// import {upload} from "./Multer";
//
function remove(path: string, options?: RmOptions) {
	return fs.rmSync(path, options);
}
//
// function get() {
//
// }
//
// const storage = multer.diskStorage({
// 	destination: function (req, file, cb) {
// 		cb(null, '/tmp/my-uploads')
// 	},
// 	filename: function (req, file, cb) {
// 		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
// 		cb(null, file.fieldname + '-' + uniqueSuffix)
// 	}
// })
//
// const uploadThumbnail = upload.single("thumbnail");
export default {remove};