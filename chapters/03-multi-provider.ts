import { generateText } from "../src/core/generate-text";
import { createAnthropic } from "../src/providers/anthropic";
import { createOpenAI } from "../src/providers/openai";
import type { Message } from "../src/types";

const messages: Message[] = [
    { role: 'user', content: 'AIエージェントとは何ですか？' }
];

// OpenAI
const openai = createOpenAI();
const result1 = await generateText({ model: openai('gpt-5-mini'), messages });
console.log('OpenAI:', result1.text);

// Anthropic
const anthropic = createAnthropic();
const result2 = await generateText({ model: anthropic('claude-haiku-4-5-20251001'), messages });
console.log('Anthropic:', result2.text);
