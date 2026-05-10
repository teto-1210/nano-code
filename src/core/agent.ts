import type { LanguageModel, Message, Tool } from "../types";
import { requestApproval } from "./approval";
import { generateText } from "./generate-text";


export interface AgentConfig {
    name: string;
    instructions: string;
    model: LanguageModel;
    tools: Record<string, Tool>;
    maxSteps?: number;
    verbose?: boolean;
    approvalFunc?: (toolName: string, args: any) => Promise<boolean>;
}

/**
 * ツール実行関数
 */
async function executeTool(tool: Tool, args: any): Promise<string> {
    try{
        return await tool.execute(args);
    } catch (error) {
        return `エラー: ${(error as Error).message}`;
    }
}

/**
 * Agen Class
 */
export class Agent {
    private name: string;
    private instructions: string;
    private model: LanguageModel;
    private tools: Record<string, Tool>;
    private maxSteps: number;
    private verbose: boolean;
    private approvalFunc?: (toolName: string, args: any) => Promise<boolean>;

    constructor(config: AgentConfig) {
        this.name = config.name;
        this.instructions = config.instructions;
        this.model = config.model;
        this.tools = Object.values(config.tools);
        this.maxSteps = config.maxSteps ?? 10;
        this.verbose = config.verbose ?? false;
        this.approvalFunc = config.approvalFunc ?? requestApproval;
    }

    async generate(userPrompt: string): Promise<{text: string}> {

        const messages: Message[] = [
            { role: "system", content: this.instructions },
            { role: "user", content: userPrompt },
        ];

        let currentStep = 0;
        let finalText = '';
        let toolCallCount = 0;

        while (currentStep < this.maxSteps) {
            currentStep++;

            if(this.verbose) {
                console.log(`\n===ステップ ${currentStep}/${this.maxSteps} ===`);
            }

            const response = await generateText({
                model: this.model,
                messages,
                tools: this.tools,
            });

            if(response.text){
                finalText = response.text;
                if(this.verbose) {
                    console.log(`[応答] ${response.text}`);
                }
            }

            if(response.toolCalls && response.toolCalls.length > 0) {
                messages.push({
                    role: "assistant",
                    content: response.text,
                    toolCalls: response.toolCalls,
                });

                for (const toolCall of response.toolCalls) {
                    const tool = this.tools.find(t => t.name === toolCall.name);

                    if (!tool) {
                        messages.push({
                            role: "tool",
                            toolCalled: toolCall.toolCalled,
                            name: toolCall.name,
                            content: `エラー: Tool ${toolCall.name} が見つかりません。`
                        });
                        continue;
                    }
                        
                    if(this.verbose) {
                        console.log(`[ツール実行] ${toolCall.name} with args ${JSON.stringify(toolCall.args)}`);
                    }
                    
                    if(tool.needsApproval) {
                        const approved = await this.approvalFunc(toolCall.name, toolCall.args);
                        if (!approved) {
                            messages.push({
                                role: "tool",
                                toolCalled: toolCall.toolCalled,
                                name: toolCall.name,
                                content: `ユーザーによってキャンセルされました。別の方法を検討してください。`
                            });
                            continue;
                        }
                    }

                    // execute tool
                    const result = await executeTool(tool, toolCall.args);
                    toolCallCount++;

                    if(this.verbose) {
                        console.log(`[結果] ${result.slice(0, 200)}$result.length > 200 ? '...' : ''}`);
                    }

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
                content: response.text,
            });
            break;
        }

        if(currentStep >= this.maxSteps) {
            console.warn(`最大ステップ数(${this.maxSteps})に達しました。処理を終了します。`);
        }

        if(toolCallCount === 0 && currentStep === 1) {
            console.warn(`警告: ツール呼び出しがありませんでした。エージェントが適切に機能していない可能性があります。`);
        }

        return { text: finalText };

    }
}