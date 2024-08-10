// UserController.ts
import { Request, Response } from 'express';
import {Middleware, Get, Prefix} from 'express-router-controller-khmer';
import authMiddleware from "../config/AuthMiddleware";

@Prefix("")
export default class ClientController {
	
	@Get('/clients')
	@Middleware(authMiddleware)
	getAllUsers(req: Request, res: Response) {
		return res.send('Get all clients');
	}
	
	@Get('/clients/:id')
	getUserById(req: Request, res: Response) {
		const userId: number = Number(req.params.id);
		res.send(`Get client with ID: ${userId}`);
	}
}
