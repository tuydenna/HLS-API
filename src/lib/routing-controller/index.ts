import {IAutoRegister, IConfigRouter} from "@lib/routing-controller/types/loader";
import AutoRegisterController from "@lib/routing-controller/loader/auto-resgister";
import DefaultResponseException from "@lib/routing-controller/exception/default-response-exception";
import DefaultErrorException from "@lib/routing-controller/exception/default-error-exception";

export default function AutoRegisterControllers(config: IConfigRouter): IAutoRegister {
	return new AutoRegisterController(
		config.router,
		config.controllerPath,
		config.logging,
		{
			responseInterceptor: config.responseInterceptor || new DefaultResponseException(),
			errorInterceptor: config.errorInterceptor || new DefaultErrorException()
		}
	)
}

