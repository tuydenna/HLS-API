import fs from 'fs';
import path from 'path';
import "reflect-metadata"
import {NextFunction, Request, Response, Router} from "express";
import {AutoRegisterInt} from "../index";

abstract class MainLoad {
	
	private routesWithMiddleware = [];
	private routesWithoutMiddleware = [];
	protected routes: string[] = [];
	
	protected constructor(private router: Router, private controllerPath: string[], private logger: boolean = false) {
		this.register().then(()=>{
			try {
				this.loadRoutes();

			}catch (e) {
				console.log("error");
			}
		});
	}
	
	private async register() {
		return new Promise((resolve, reject) => {
			try {
				this.controllerPath.forEach(async (conPath: any) => {
					if ((typeof conPath) === "function") {
						const classInstance = new conPath();
						await this.getDataReflection(classInstance);
					} else {
						const arr: string[] = conPath.includes("\\") ? conPath.split("\\") : conPath.split("/");
						if (arr.length) {
							const lastPath: string = arr[arr.length-1];
							if (lastPath) {
								let extArray: string[] = lastPath.split(".");
								if (extArray.length) {
									const ext: string = extArray[extArray.length -1];
									if (extArray[0] == "*") {
										const foldersPath: string = conPath.replace("*."+ext, "");
										fs.readdirSync(foldersPath).forEach(async (file) => {
											if (file.endsWith('.'+ext)) {
												const controller = await import(path.join(foldersPath, file));
												const controllerInstance = new controller[Object.keys(controller)[0]]();
												await this.getDataReflection(controllerInstance);
											}
										})
									} else {
										const controller = await import(conPath);
										const controllerInstance = new controller[Object.keys(controller)[0]]();
										await this.getDataReflection(controllerInstance);
									}
								}
							}
						}
					}
				});
				resolve(true);
			} catch (e) {
				console.warn("Controller autoload register failed!", e);
				reject(e);
				throw e;
			}
		})
	}
	
	private getDataReflection(classInstance: ClassDecorator): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				const methods: string[] = Object.getOwnPropertyNames(classInstance.constructor.prototype);
				console.log(classInstance);
				methods.forEach((methodName: string) => {
					//const router = Reflect.getMetadata('router', controllerInstance.constructor);
					const prefix        = Reflect.getMetadata('prefix', classInstance.constructor);
					const middleware    = Reflect.getMetadata('middleware', classInstance.constructor, methodName);
					const method        = Reflect.getMetadata('method', classInstance, methodName);
					let path            = Reflect.getMetadata('path', classInstance, methodName);
					if (path && method) {
						path = prefix ? prefix.trim() + path : path;
						if (middleware) {
							this.routesWithMiddleware.push({path, method: method.toLowerCase(), middleware, function: classInstance[methodName].bind(classInstance)});
						} else {
							this.routesWithoutMiddleware.push({path, method: method.toLowerCase(), function: classInstance[methodName].bind(classInstance)});
						}
					}
				});
				resolve(true);
			} catch (e) {
				console.log("get reflection failed!", e);
				reject(e);
				throw e;
			}
		})
	}
	
	private loadRoutes() {
		for (const route of this.routesWithoutMiddleware ) {
			this.router[route.method](route.path, resolveRoute(route.function));
		}

		for (const route of this.routesWithMiddleware ) {
			this.router.use(route.path, resolveRoute(route.middleware));
			this.router[route.method](route.path, resolveRoute(route.function));
		}

		if (this.logger) {
			const stacks = this.router.stack;
			stacks.forEach((layer, index: number) => {
				if (layer.route) {
					this.routes.push(layer.route.path);
					console.log(layer.route.path, stacks[index+1] ? stacks[index+1].route ? "" : stacks[index+1].name : "");
				}
			});
		}
	}
}

function resolveRoute(callBack: Function) {
	return function (req: Request, res: Response, next: NextFunction) {
		Promise.resolve(callBack(req, res, next)).catch(next).then(data=> {
			res.status(200).json(data);
		});
	}
}

// Automatically load and use controllers with decorated methods
export default class AutoRegisterController extends MainLoad implements AutoRegisterInt {
	
	constructor(router: Router, controllerPath: string[], logger: boolean = false) {
		super(router, controllerPath, logger);
	}
	
	getAllRegisterRoutes(): string[] {
		return this.routes;
	}
}

