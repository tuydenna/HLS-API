import fs from "fs";
import {DummyTable} from "../database/tables";
import * as crypto from "crypto";

function insert(data: any) {
	let existData = get();
	if (Array.isArray(data)) {
		existData.concat(data);
		data.map(item => {
			item.id = crypto.randomUUID();
		})
	} else {
		existData.push(data);
		data.id = crypto.randomUUID();
	}
	return fs.writeFileSync(DummyTable, JSON.stringify(existData));
}

function get() {
	let data = fs.readFileSync(DummyTable, {encoding:"utf8"});
	return data ? JSON.parse(data) : [];
}

export default {insert, get};