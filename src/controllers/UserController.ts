// UserController.ts
import { Request, Response } from 'express';
import {Get, Post, Prefix} from '../config/ExpressMethod';
import db from "../config/database/db";
import {faker} from "@faker-js/faker";
import {Put} from "express-router-controller-khmer";

@Prefix("/api")
export default class UserController {
	
	@Get('/users')
	//@AuthMiddleware()
	async getAllUsers(req: Request, res: Response) {
		return res.send(await db.user.findMany());
	}
	
	@Get('/users/:id')
	getUserById(req: Request, res: Response) {
		const userId = req.params.id;
		res.send(`Get user with ID: ${userId}`);
	}
	
	@Post('/users')
	async create(req: Request, res: Response) {
		const user = await db.user.create({
			data: {
				name: faker.person.fullName(),
				address: {
					city: faker.location.city(),
					zip: faker.location.zipCode(),
					state: faker.location.state(),
					street: faker.location.street()
				},
				email: faker.internet.email()
			}
		});
		return res.send(user);
	}
	
	@Put('/users/:id')
	async update(req: Request, res: Response) {
		const user = await db.user.update({
			where: {id: req.params.id},
			data: {
				name: faker.person.fullName(),
				address: {
					city: faker.location.city(),
					zip: faker.location.zipCode(),
					state: faker.location.state(),
					street: faker.location.street()
				},
				email: faker.internet.email()
			}
		});
		return res.send(user);
	}
}
