import type { LanguageModel } from "../types";
import { createAnthropic } from "./anthropic";
import { createOpenAI } from "./openai";


export function createModelFromEnv(): LanguageModel {
    const provider = process.env.LLM_PROVIDER;
    const modelName = process.env.LLM_MODEL;
    const apiKey = process.env.LLM_API_KEY;

    if (!provider) {
        throw new Error("LLM_PROVIDER 環境変数が設定されていません");
    }
    if (!modelName) {
        throw new Error("LLM_MODEL 環境変数が設定されていません");
    }
    

    switch (provider.toLowerCase()) {
        case "openai": {
            if (apiKey && !process.env.OPENAI_API_KEY) {
                process.env.OPENAI_API_KEY = apiKey;
            }
            const openai = createOpenAI();
            return openai(modelName);
        }
        case "anthropic": {
            // Anthropicのモデルを返す関数を実装する必要があります
            if (apiKey && !process.env.ANTHROPIC_API_KEY) {
                process.env.ANTHROPIC_API_KEY = apiKey;
            }
            const anthropic = createAnthropic();
            return anthropic(modelName);
        }
        default:
            throw new Error(`Unsupported LLM provider: ${provider}`);
    }
}