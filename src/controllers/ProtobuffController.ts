// UserController.ts
import { Request, Response } from 'express';
import {Middleware, Get, Prefix} from 'express-router-controller-khmer';
import authMiddleware from "../config/AuthMiddleware";

@Prefix("")
export default class ClientController {
	
	@Get('/proto-buff')
	getAllUsers(req: Request, res: Response) {
		const schema = require("./user_pb");
		
		const din = new schema.User();
		din.setId(1)
		din.setName("din")
		din.setAge(23)
		
		const xiao = new schema.User();
		xiao.setId(2);
		xiao.setName("xiao");
		xiao.setAge(23);
		
		const users = new schema.Users();
		users.addUser(din);
		users.addUser(xiao);
		
		const bytes = users.serializeBinary();
		return res.send(bytes);
	}
	
}
