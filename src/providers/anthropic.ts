import Anthropic from "@anthropic-ai/sdk";
import { LLMApiError, type GenerateParams, type GenerateTextResult, type LanguageModel, type Message, type Provider, type ToolCall } from "../types";


// [CHECK]
// AnthropicInputSchemaに対して、pramatersのRecord<string, any>の型定義が広い
// 上記の対応要関数と型定義
type AnthropicInputSchema = {
  type: "object";
  properties?: unknown;
  required?: string[] | null;
  [k: string]: unknown;
};

function toAnthropicInputSchema(schema: Record<string, any>): AnthropicInputSchema {
  return {
    type: "object",
    ...schema,
  };
}




export function createAnthropic(config?: {
    apiKey?: string;
    baseURL?: string;
    maxRetries?: number;
}): Provider {
    // Initialize SDK
    const client = new Anthropic({
        apiKey: config?.apiKey,
        baseURL: config?.baseURL,
        maxRetries: config?.maxRetries ?? 0,
    });

    // Convert Message Type from Nano Code Message to Anthropic Chat Message
    function convertMessages(messages: Message[]) {
        return messages
            .filter(m => m.role !== 'system')
            .map((m) => {
                if(m.role === 'tool') {
                    return {
                        role: 'user' as const,
                        content: [
                            {
                                type: 'tool_result' as const,
                                tool_use_id: m.toolCalled,
                                content: m.content
                            }
                        ]
                    };
                }

                if(m.role === 'assistant' && m.toolCalls) {
                    const content: any[] = [];
                    if(m.content) {
                        content.push({type: 'text' as const, text: m.content});
                    }

                    for (const tc of m.toolCalls) {
                        content.push({
                            type: 'tool_call' as const,
                            id: tc.toolCalled,
                            name: tc.name,
                            input: tc.args
                        });
                    }
                    return {role: 'assistant' as const, content};
                }

                return {
                    role: m.role as 'user' | 'assistant',
                    content: m.content
                };
            });
    }

    // Mapping finish reason
    function mapFinishReason(reason: string | null): GenerateTextResult['finishReason'] {
        switch(reason) {
            case 'end_turn': return 'stop';
            case 'max_tokens': return 'length';
            case 'tool_use': return 'tool_calls';
            default: return 'stop';
        }
    }

    return (modelId: string): LanguageModel => ({
        async doGenerate(params: GenerateParams): Promise<GenerateTextResult> {
            // Convert Tool Definitions to Anthropic Format
            const tools = params.tools?.map(tool => ({
                name: tool.name,
                description: tool.description,
                input_schema: toAnthropicInputSchema(tool.parameters),
            }));

            // systemメッセージの分離
            const systemMessages = params.messages.filter(m => m.role === 'system');
            const system = systemMessages.map(m => ({type: "text" as const, text: m.content}));


            try {
                // Call Anthropic API
                const response = await client.messages.create(
                    {
                        model: modelId,
                        system,
                        messages: convertMessages(params.messages),
                        max_tokens: params.maxTokens ?? 4096,
                        temperature: params.temperature,
                        ...(tools && tools.length > 0 && { tools })
                    },
                    { signal: params.signal }
                );
                // const completion = await client.messages.create(
                //     {
                //         model: modelId,
                //         system,
                //         messages: convertMessages(params.messages),
                //         max_tokens: params.maxTokens ?? 4096,
                //         temperature: params.temperature,
                //         ...(tools && tools.length > 0 && { tools })
                //     },
                //     { signal: params.signal }
                // );


                // Extract Text contents and Tool Calls from response
                const textBlocks = response.content.filter(b => b.type === 'text');
                const text = textBlocks.map((b: any) => b.text).join('');

                const toolUseBlocks = response.content.filter(
                    b => b.type === 'tool_use'
                );

                // [CHECK]
                // openAI側はlengthのvalidationしてないのに、こっち側はしてるの何故だろう。
                const toolCalls: ToolCall[] | undefined = 
                    toolUseBlocks.length > 0
                        ? toolUseBlocks.map((b: any) => ({
                            toolCalled: b.id,
                            name: b.name,
                            args: b.input
                        }))
                        : undefined;
                
                return {
                    text,
                    finishReason: mapFinishReason(response.stop_reason),
                    toolCalls,
                    usage: {
                        promptTokens: response.usage?.input_tokens,
                        completionTokens: response.usage?.output_tokens,
                        totalTokens: response.usage?.input_tokens + response.usage?.output_tokens,
                    }
                };

            } catch (error) {
                if (error instanceof Anthropic.APIError) {
                    throw new LLMApiError(
                        error.status ?? 500,
                        'anthropic',
                        error.error?.type ?? undefined,
                        error.message,
                        error
                    );
                }
                throw error;
            }
        }
    })
};