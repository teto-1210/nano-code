import * as path from "path";
import { createModelFromEnv } from "../src/providers/modelFactory";
import { loadInstructions } from "../src/core/prompt";
import { Agent } from "../src/core/agent";
import { readFile } from "../src/tools/readFile";
import { writeFile } from "../src/tools/writeFile";
import { editFile } from "../src/tools/editFile";
import { execCommand } from "../src/tools/execCommand";



async function main() {
    const args = process.argv.slice(2);

    if(args.length === 0) {
        console.error('使い方: bun run agent "<タスクの説明>"');
        console.error('例: bun run agent "現在のディレクトリにあるファイルをリストアップしてください"');
        process.exit(1);
    }

    const userPrompt = args.join(' ');

    // 環境変数からモデルを生成
    const model = createModelFromEnv();

    // 安全設定
    const workspaceRoot = path.resolve(process.cwd(), 'workspace');

    // プロンプトを読み込む
    const instructions = loadInstructions(workspaceRoot);

    console.log(instructions);

    // Agentの初期化
    const agent = new Agent({
        name: 'nano-code',
        model,
        instructions,
        tools: {
            readFile,
            writeFile,
            editFile,
            execCommand,
        },
        maxSteps: 15,
    });

    console.log('エージェント起動\n');
    console.log(`ユーザープロンプト: ${userPrompt}\n`);

    try {
        const result = await agent.generate(userPrompt);
        console.log('\n===最終応答===');
        console.log(result.text);   
    } catch (error) {
        console.error('エージェントの実行中にエラーが発生しました:', (error as Error).message);
        process.exit(1);
    }
}

main();


