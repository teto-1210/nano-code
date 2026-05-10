import { requestApproval } from "../core/approval";
import { generateText } from "../core/generate-text";
import { createOpenAI } from "../providers/openai";
import { readFile } from "../tools/readFile";
import { writeFile } from "../tools/writeFile";
import type { Message, Tool } from "../types";

const openai = createOpenAI();
const model = openai('gpt-5-mini');
const tools = [readFile, writeFile];




// ツール実行関数（この節で定義）
async function executeTool(tool: Tool, args: any): Promise<string> {
    try{
        return await tool.execute(args);
    } catch (error) {
        return `エラー: ${(error as Error).message}`;
    }
}

export async function generate(userMessage: string): Promise<string> {
    const messages: Message[] = [
        { role: "system", content: "あなたはファイル操作ができるアシスタントです。"},
        { role: "user", content: userMessage }
    ];

    const MAX_STEPS = 20;
    let stepCount = 0;

    let finalText = '';


    while (stepCount < MAX_STEPS) {
        stepCount++;
        // Step1: Invoke LLM
        const response = await generateText({
            model,
            messages,
            tools,
        })

        if(response.text) {
            finalText = response.text;
            console.log(response.text);
        }

        // Step2: If tool call is required, execute the tool and add the result to messages, then continue the loop to call LLM again
        if(response.toolCalls && response.toolCalls.length > 0) {
            messages.push({
                role: "assistant",
                content: response.text || '',
                toolCalls: response.toolCalls,
            });

            for(const toolCall of response.toolCalls) {
                

                // Step3: Search tool and Execute
                const tool = tools.find(t => t.name === toolCall.name);
                if(!tool) {
                    throw new Error(`Tool ${toolCall.name} not found`);
                }

                console.log(`[ツール実行] ${toolCall.name}`);

                // Check if tool needs approval
                if(tool.needsApproval) {
                    const approved = await requestApproval(
                        toolCall.name,
                        toolCall.args,
                    );

                    if(!approved) {
                        // if not approved by user, notify llm using natural language
                        messages.push({
                            role: "tool",
                            toolCalled: toolCall.toolCalled,
                            name: toolCall.name,
                            content: `ユーザーがこのツールの実行を拒否しました。ツール名: ${toolCall.name}。別の方法を検討してください。`,
                        });
                        continue;
                    }
                }


                const result = await executeTool(tool, toolCall.args);

                // Step4: Add tool result to messages
                messages.push({
                    role: "tool",
                    toolCalled: toolCall.toolCalled,
                    name: toolCall.name,
                    content: result,
                });
            }

            continue;
        }

        messages.push({
            role: "assistant",
            content: response.text || '',
        });

        if(response.finishReason === 'stop') {
            break;
        }

        if(stepCount >= MAX_STEPS) {
            console.warn("最大ステップ数に達しました。処理を終了します。");
            break;
        }
    }

    return finalText;
}