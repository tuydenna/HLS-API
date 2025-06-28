import db from "@config/database/db";
import {User} from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import {getEnv} from "@utils/index";
import { StringValue } from "ms";

export default class UserService {
	async getOne(id: string): Promise<User> {
		return db.user.findFirstOrThrow({where: {id}});
	}

	async create(data: User): Promise<User> {
		try {
			data.password = bcrypt.hashSync(data.password, 10);
			const user: User = await db.user.create({data});
			const token: string = jwt.sign({authId: user.id}, getEnv("JWT_SECRET") || "", {expiresIn: getEnv("JWT_EXPIRE_IN") as StringValue})
			user.token = token;
			user.accessToken = token;
			await db.user.update({where: {id: user.id}, data: {token: token, accessToken: token}});
			return user;
		} catch (e) {
			if (e.code === "P2002") {
				throw new Error("Email already exists");
			}
			console.warn("db error", e.message);
			throw new Error(e.message);
		}
	}
}