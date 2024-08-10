import multer from "multer";
import File from "../services/File";

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'storages/thumbnail')
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
		cb(null, file.fieldname + '-' + uniqueSuffix + File.getFileExt(file))
	},
})

const upload = multer({ storage: storage });

export {upload};