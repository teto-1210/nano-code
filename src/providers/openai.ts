import OpenAI from "openai";
import { LLMApiError, type GenerateParams, type GenerateTextResult, type LanguageModel, type Message, type Provider, type ToolCall } from "../types";

export function createOpenAI(config?: {
    apiKey?: string;
    baseURL?: string;
    maxRetries?: number;
}): Provider {
    // Initialize SDK
    const client = new OpenAI({
        apiKey: config?.apiKey,
        baseURL: config?.baseURL,
        maxRetries: config?.maxRetries ?? 0,
    });

    // Convert Message Type from Nano Code Message to OpenAI Chat Message
    function convertMessages(messages: Message[]) {
        return messages.map((m) => {
            if(m.role === 'tool') {
                return {
                    role: 'tool' as const,
                    tool_call_id: m.toolCalled,
                    content: m.content
                };
            }

            if(m.role === 'assistant' && m.toolCalls) {
                return {
                    role: 'assistant' as const,
                    content: m.content,
                    tool_calls: m.toolCalls.map((tc) => ({
                        id: tc.toolCalled,
                        type: 'function' as const,
                        function: {name: tc.name, arguments: JSON.stringify(tc.args)},
                    }))
                };
            }

            return {
                role: m.role,
                content: m.content
            };
        });
    }

    // Mapping finish reason
    function mapFinishReason(reason: string | null): GenerateTextResult['finishReason'] {
        switch(reason) {
            case 'stop': return 'stop';
            case 'length': return 'length';
            case 'content_filter': return 'content_filter';
            case 'tool_calls': return 'tool_calls';
            default: return 'stop';
        }
    }

    return (modelId: string): LanguageModel => ({
        async doGenerate(params: GenerateParams): Promise<GenerateTextResult> {
            // Convert Tool Definitions to OpenAI Format
            const tools = params.tools?.map(tool => ({
                type: 'function' as const,
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                }
            }));

            try {
                // Call OpenAI API
                const completion = await client.chat.completions.create(
                    {
                        model: modelId,
                        messages: convertMessages(params.messages),
                        temperature: params.temperature,
                        max_completion_tokens: params.maxTokens,
                        ...(tools && tools.length > 0 && { tools })
                    },
                    { signal: params.signal }
                );

                // Convert OpenAI Response to Common Format
                const choice = completion.choices[0];
                if (!choice) {
                    // [CHECK] constructorの定義的に以下の書き方は問題ありそう
                    // throw new LLMApiError('No choices returned from OpenAI API');
                    throw new LLMApiError(500, 'openai', undefined, 'No choices returned from OpenAI API');
                }
                const message = choice.message;

                // [CHECK]
                // ChatCompletionMessageCustomToolCallはtypeが'function'のときのみ、functionプロパティが存在
                // そのため、typescript的にはtypeの判定が必要
                const toolCalls: ToolCall[] | undefined = message.tool_calls?.map(tc => {
                    if (tc.type === 'function') {
                        return {
                            toolCalled: tc.id,
                            name: tc.function.name,
                            args: JSON.parse(tc.function.arguments)
                        };
                    }
                    return undefined;
                }).filter((tc): tc is ToolCall => tc !== undefined);    // User-Defined Type Guards

                return {
                    text: message.content ?? '',
                    finishReason: mapFinishReason(choice.finish_reason),
                    toolCalls,
                    usage: {
                        promptTokens: completion.usage?.prompt_tokens,
                        completionTokens: completion.usage?.completion_tokens,
                        totalTokens: completion.usage?.total_tokens,
                    }
                };
            } catch (error) {
                if (error instanceof OpenAI.APIError) {
                    throw new LLMApiError(
                        error.status ?? 500,
                        'openai',
                        error.code ?? undefined,
                        error.message,
                        error
                    );
                }
                throw error;
            }
        }
    })
};