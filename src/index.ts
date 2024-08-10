import AutoRegisterController from "./routes/router";
import {Router} from "express";

interface ConfigInt {
	router: Router,
	controllerPath: any[],
	logging: boolean
}

export interface AutoRegisterInt {
	getAllRegisterRoutes(): string[]
}

export default function AutoRegisterControllers(config: ConfigInt): AutoRegisterInt {
	return new AutoRegisterController(config.router, config.controllerPath, config.logging)
}

