console.log("Hello via Bun!");

import { createOpenAI } from './src/providers/openai';
import { generateText } from './src/core/generate-text';

const openai = createOpenAI();
const model = openai('gpt-5-mini');

const result = await generateText({
    model,
    messages: [
        { role: 'user', content: 'TypeScriptの特徴を3つ挙げてください。' }
    ],
});

console.log(result.text);