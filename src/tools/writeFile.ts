import * as fs from "fs/promises";
import * as path from "path";

const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace');

async function writeFileExecute(args: {
    path: string;
    content: string;
}): Promise<string> {
    const absPath = path.resolve(WORKSPACE_ROOT, args.path);

    const allowedPrefix = WORKSPACE_ROOT + path.sep;
    if (!absPath.startsWith(allowedPrefix) && absPath !== WORKSPACE_ROOT) {
        throw new Error(`Access denied: ${args.path} is outside of the workspace`);
    }

    // Create directory
    const dir = path.dirname(absPath);
    await fs.mkdir(dir, { recursive: true });

    // ファイルの書き込み
    await fs.writeFile(absPath, args.content, 'utf-8');
    return `File written: ${args.path}`;
}

export const writeFile = {
    name: "writeFile",
    description: 'ワークスペース内の指定されたパスにファイルを作成または上書きする。存在しないディレクトリが含まれている場合は自動的に作成される。',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: "書き込むファイルのパス"
            },
            content: {
                type: 'string',
                description: "ファイルに書き込む内容"
            }
        },
        required: ['path', 'content']
    },
    execute: writeFileExecute
};