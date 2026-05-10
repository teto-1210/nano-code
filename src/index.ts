
import { createOpenAI } from './providers/openai';
import { generateText } from './core/generate-text';
import { allTools } from './tools';
import { readFile } from './tools/readFile';
import type { Message } from './types';
import { generate } from './_debug/memo';

console.log("Hello via Bun!");
await generate("README.mdのタイトルを大文字に変換して");
// const openai = createOpenAI();
// const model = openai('gpt-5-mini');

// const tools = [readFile];

// const messages: Message[] = [
//     {role: "system", content: "あなたはファイル操作アシスタントです。"},
//     {role: "user", content: }
// ]

// const result = await generateText({
//     model,
//     messages: [
//         { role: 'user', content: 'TypeScriptの特徴を3つ挙げてください。' }
//     ],
//     // [CHECK] type of tools
//     tools: allTools,
// });

// console.log(result.text);