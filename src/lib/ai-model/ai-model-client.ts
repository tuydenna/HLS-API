import {Post} from "@prisma/client";
import {getEnv} from "@utils/index";
import SysLog from "@lib/logger/sys-log";

export default class AiModelClient {
    static async trainModel(data: Post) {
        try {
            return await fetch(getEnv("MODEL_TRAIN_API"), {
                headers: {"content-type": "application/json"},
                method: "POST",
                body: JSON.stringify(data),
            }).then(res => res.json());
        } catch (e) {
            SysLog.error("[Model API]", "failed to train model!", e);
            throw new Error("failed to train model!");
        }
    }

    static async search(searchText: string): Promise<{status: string, data: number[]}> {
        try {
            const url: string = getEnv("MODEL_SEARCH_API") + "?search_text=" + searchText;
            return await fetch(url, {
                headers: {"content-type": "application/json"},
                method: "GET"
            }).then(res => res.json());
        } catch (e) {
            SysLog.error("[Model API]", "failed to train model!", e);
            throw new Error("failed to train model!");
        }
    }
}

