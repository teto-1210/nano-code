// Tool Type
export type Tool = {
    name: string;
    description: string;
    parameters: Record<string, any>;
    execute: (args: Record<string, unknown>) => Promise<string>;
};

// Calling Tool Type
export type ToolCall = {
    toolCalled: string;
    name: string;
    args: Record<string, unknown>;
};

// Results of Calling Tool Type
export type ToolResult = {
    toolCalled: string;
    result: string;
};

// Message Type
export type Message = 
    | { role: "system" | "user"; content: string }
    | { role: "assistant"; content: string; toolCalls?: ToolCall[] }
    | { role: "tool"; toolCalled: string; name: string; content: string };

// Usage Type
// Metadata of token usage
export type Usage = {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
};

// Common Generated Result Type
export type GenerateTextResult = {
    text: string;
    finishReason: "stop" | "length" | "content_filter" | "tool_calls" | "error";
    toolCalls?: ToolCall[]; // if LLM requests to call tools
    usage?: Usage;
};

// Args for generateText function
export type GenerateParams = {
    messages: Message[];
    tools?: Tool[];
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;   //[Check] 一般的なTypeSctiptの型. AbortControllerも要確認
};

// Interface for LLM
export interface LanguageModel {
    doGenerate(params: GenerateParams): Promise<GenerateTextResult>;
}

// Type of Procider function
export type Provider = (modelId: string) => LanguageModel;

// Common LLM API Error
export class LLMApiError extends Error {
    constructor(
        public status: number,
        public provider: string,
        public code?: string,
        message?: string,
        public raw?: unknown
    ) {
        super(message || `LLM API Error: ${provider} returned ${status}`);
        this.name = "LLMApiError";
    }
}