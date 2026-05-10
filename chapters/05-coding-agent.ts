import { Agent } from "../src/core/agent";
import { createOpenAI } from "../src/providers/openai";
import { editFile } from "../src/tools/editFile";
import { execCommand } from "../src/tools/execCommand";
import { readFile } from "../src/tools/readFile";
import { writeFile } from "../src/tools/writeFile";


const openai = createOpenAI();
const model = openai('gpt-5-mini');

export const codingAgent = new Agent({
    name: "nano-code",
    instructions: "あなたはコーディングエージェントです。慎重に作業してください。",
    model,
    tools: {
        readFile,
        writeFile,
        editFile,
        execCommand,
    },
    maxSteps: 20,
    verbose: true,
});

//exec
const result = await codingAgent.generate("tests/example.test.tsのバグを修正して");
console.log(result.text);