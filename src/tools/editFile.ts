import * as fs from "fs/promises";
import * as path from "path";

const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace');

async function editFileExecute(args: {
    path: string;
    oldText: string;
    newText: string;
}): Promise<string> {
    const absPath = path.resolve(WORKSPACE_ROOT, args.path);

    const allowedPrefix = WORKSPACE_ROOT + path.sep;
    if (!absPath.startsWith(allowedPrefix) && absPath !== WORKSPACE_ROOT) {
        throw new Error(`Access denied: ${args.path} is outside of the workspace`);
    }

    // ファイル読み込み
    const content = await fs.readFile(absPath, 'utf-8');

    // あいまい性チェック(変更対象が一意に特定できるか確認
    // args.oldTextで分割できるか確認
    const matches = content.split(args.oldText).length -1;
    if (matches === 0) {
        const preview = args.oldText.length > 50 ? `${args.oldText.slice(0, 50)}...` : args.oldText;
        throw new Error(`Text not found: The specified oldText was not found in the file. oldText preview: "${preview}"`);
    }

    if (matches > 1) {
        throw new Error(`Ambiguous edit: The oldText appears ${matches} times in the file. Please provide a more specific oldText to identify the text to be replaced.`);
    }

    // テキスト検索と置換
    const newContent = content.replace(args.oldText, args.newText);
    await fs.writeFile(absPath, newContent, 'utf-8');

    return `File edited: ${args.oldText.slice(0,30)}... -> ${args.newText.slice(0,30)}...`;
}

export const editFile = {
    name: "editFile",
    description: "ファイルの一部を編集する。oldTextで指定した箇所をnewTextに置き換える。oldTextが複数見つかる場合はエラーを返すため、一意に特定できる範囲を指定すること。ファイル全体を読み書きするよりトークン消費が少ない。",
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: "編集するファイルのパス"
            },
            oldText: {
                type: 'string',
                description: "変更前のテキスト（一意に特定できる範囲を指定）"
            },
            newText: {
                type: 'string',
                description: "変更後のテキスト"
            }
        },
        required: ['path', 'oldText', 'newText']
    },
    execute: editFileExecute
};
