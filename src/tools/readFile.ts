import * as path from 'path';
import * as fs from 'fs/promises';

// ワークスペースのルートディレクトリ定義
const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace');

// ファイルサイズ制限
// LLMのコンテキストウィンドウ保護
const MAX_FILE_SIZE = 100 * 1024;

async function readFileExecute(args: {path: string}): Promise<string> {
    // 相対パス->絶対パス変換
    const absPath = path.resolve(WORKSPACE_ROOT, args.path);

    // ワークスペース外のアクセス用バリデーション
    const allowedPrefix = WORKSPACE_ROOT + path.sep;
    if (!absPath.startsWith(allowedPrefix) && absPath !== WORKSPACE_ROOT) {
        throw new Error(`Access denied: ${args.path} is outside of the workspace`);
    }

    // シンボリックリンク用バリデーション
    const realPath = await fs.realpath(absPath);
    if (!realPath.startsWith(allowedPrefix) && realPath !== WORKSPACE_ROOT) {
        throw new Error(`Access denied: ${args.path} is a symbolic link pointing outside of the workspace`);
    }

    // ファイルサイズと形式のチェック
    try {
        const stat = await fs.stat(absPath);
        if (!stat.isFile()) {
            throw new Error(`Access denied: ${args.path} is not a file`);
        };

        if (stat.size > MAX_FILE_SIZE) {
            throw new Error(`File too large: ${args.path} exceeds the maximum allowed size of ${MAX_FILE_SIZE} bytes`);
        };
    } catch (err) {
        // [CHECK] もう少し適切なハンドリング方法がある気がする。
        if (err instanceof Error && (err as any).code === 'ENOENT') {
            throw new Error(`File not found: ${args.path}`);
        }
        throw err;
    }

    // ファイルの読み込み
    return await fs.readFile(absPath, 'utf-8');
}

export const readFile = {
    name: "readFile",
    description: 'ワークスペース内の指定されたパスのファイル内容を文字列として読み込む。ファイルが存在しない場合はエラーを返す。100KBを超える巨大ファイルは読み込めない（コンテキストウィンドウ保護のため）。相対パスまたは絶対パスを指定できる。',
    needsApproval: false,
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: "読み込むファイルのパス（例: 'README.md', 'src/index.ts'）"
            }
        },
        required: ['path']
    },
    execute: readFileExecute
};