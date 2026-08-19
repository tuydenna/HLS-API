import {Post} from "@prisma/client";
import {getEnv} from "@utils/index";
import SysLog from "@lib/logger/sys-log";
import ErrorException from "@config/error/error-exception";

export default class AiModelClient {
    static baseAPI: string = getEnv("AI_MODEL_API") + "/faiss_model"
    static async trainModel(data: Post) {
        try {
            return await fetch(AiModelClient.baseAPI + "/train", {
                headers: {"content-type": "application/json"},
                method: "POST",
                body: JSON.stringify(data),
            }).then(res => res.json());
        } catch (e) {
            SysLog.error("[Model API]", "failed to train model!", e);
            throw new ErrorException("failed to train model!", e.code || ErrorException.INTERNAL_SERVER);
        }
    }

    static async search(searchText: string): Promise<{status: string, data: number[]}> {
        try {
            const url: string = AiModelClient.baseAPI + "/search" + "?search_text=" + searchText;
            return await fetch(url, {
                headers: {"content-type": "application/json"},
                method: "GET"
            }).then(res => res.json());
        } catch (e) {
            SysLog.error("[Model API]", "failed to train model!", e);
            throw new ErrorException("failed to train model!", e.code || ErrorException.INTERNAL_SERVER);
        }
    }
}

