import { Request, Response } from 'express';
import db from "@lib/prisma/db-connector";
import {faker} from "@faker-js/faker";
import {Put, Get, Post, Prefix, Res} from "express-router-controller-khmer";
import UserService from "@services/UserService";
import ResBaseController from "@controllers/ResBaseController";

@Prefix("/api/users")
export default class UserController extends ResBaseController{

	private readonly service: UserService = new UserService();

	@Get('/')
	//@AuthMiddleware()
	async getAllUsers(@Res() res: Response) {
		return res.send(await db.user.findMany());
	}

	@Get('/:id')
	getUserById(req: Request, res: Response) {
		const userId = req.params.id;
		res.send(`Get user with ID: ${userId}`);
	}
	
	@Post('/')
	async create(req: Request, res: Response) {
		return this.resSuccess(res,  await this.service.create(req.body))
	}

	@Put('/:id')
	async update(req: Request, res: Response) {
		const user = await db.user.update({
			where: {id: req.params.id},
			data: {
				name: faker.person.fullName(),
				email: faker.internet.email()
			}
		});
		return res.send(user);
	}
}
