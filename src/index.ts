console.log("Hello via Bun!");

import { createOpenAI } from './providers/openai';
import { generateText } from './core/generate-text';
import { allTools } from './tools';

const openai = createOpenAI();
const model = openai('gpt-5-mini');

const result = await generateText({
    model,
    messages: [
        { role: 'user', content: 'TypeScriptの特徴を3つ挙げてください。' }
    ],
    // [CHECK] type of tools
    tools: allTools,
});

console.log(result.text);