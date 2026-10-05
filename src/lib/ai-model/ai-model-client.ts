import {Post} from "@prisma/client";
import {getEnv} from "@utils/index";
import SysLog from "@lib/logger/sys-log";
import ErrorException from "@config/error/error-exception";

export default class AiModelClient {
    static baseAPI: string = getEnv("AI_MODEL_API") + "/faiss_model"
    static async trainModel(data: Post) {
        try {
             const response = await fetch(AiModelClient.baseAPI + "/train", {
                headers: {"content-type": "application/json"},
                method: "POST",
                body: JSON.stringify(data),
            }).then(res => res.json());
            if (response.status !== "success") {
                 throw new ErrorException(response.message || response.statusText);
             }
        } catch (e) {
            const message: string = e.message || e;
            const code: number = e.code || ErrorException.INTERNAL_SERVER;
            SysLog.error("[Model Service][Train]", message, code);
            throw new ErrorException("[Model Service][Train]:"+ message, code);
        }
    }

    static async search(searchText: string): Promise<{status: string, data: number[]}> {
        try {
            const url: string = AiModelClient.baseAPI + "/search" + "?search_text=" + searchText;
            const response = await fetch(url, {
                headers: {"content-type": "application/json"},
                method: "GET"
            });
            if (!response.ok) {
                throw new ErrorException(response.statusText, response.status);
            }
            const resData: {status: string, data: number[], message?: string} = await response.json();
            if (Number(resData.status) === ErrorException.INTERNAL_SERVER) {
                throw new ErrorException(`${resData.message || "Internal Error"}`);
            }
            // Remove duplicate indexes
            const vectorSearchIndexes: number[] = resData.data;
            if (vectorSearchIndexes.length) {
                resData.data = Array.from(new Set(vectorSearchIndexes).values());
            }

            return resData;
        } catch (e) {
            const message: string = e.message || e;
            const code: number = e.code || ErrorException.INTERNAL_SERVER;
            throw new ErrorException("[Model Service][Search]:"+ message, code);
        }
    }
}

