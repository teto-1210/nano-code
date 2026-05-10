import {spawn} from 'child_process';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace');

// Allowed Commands
const ALOWED_COMMANDS = ["bun", "ls", "git", "gh"];

// 出力サイズの上限
const MAX_OUTPUT_LENGTH = 2048;

// 危険な文字の正規表現
const dangerousChars = /[;&`$]/;

/**
 * parseCommand
 * コマンド文字列の解析
 */
type Quote = '"' | "'" | null;

export function parseCommand(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let quote: Quote = null;
    let escaped = false;

    for (const ch of input) {

        // quote内の処理
        if (quote) {
            if (escaped) {
                current += ch;
                escaped = false;
                continue;
            }

            if (ch === '\\' && quote === '"') {
                escaped = true;
                continue;
            }

            if(ch === quote) {
                quote = null;
                continue;
            }
            current += ch;
            continue;
        }

        // クォート開始
        if (ch === '"' || ch === "'") {
            quote = ch;
            continue;
        }

        // 空白でトークン区切り
        if (/\s/.test(ch)) {
            if (current.length > 0) {
                tokens.push(current);
                current = '';
            }
            continue;
        }
        current += ch;
    }

    if (quote) {
        throw new Error(`Unclosed quote: ${quote}`);
    }

    if (current.length > 0) {
        tokens.push(current);
    }

    return tokens;
}

/**
 * execCommandExecute
 * 安全なコマンドの実行
 */
async function execCommandExecute(args: {command: string}): Promise<string> {
    // 危険文字チェック
    if (dangerousChars.test(args.command)) {
        throw new Error(`Invalid command: Command contains dangerous characters. Allowed characters are alphanumeric, spaces, and basic punctuation.`);
    };

    // Parse Command
    const parts = parseCommand(args.command);
    if (parts.length === 0) {
        throw new Error('No command provided');
    };

    const commandName = parts[0] as string;
    const commandArgs = parts.slice(1);

    // Check Allowed Commands
    if (!ALOWED_COMMANDS.includes(commandName)) {
        throw new Error(`Command not allowed: ${commandName}. Allowed commands are: ${ALOWED_COMMANDS.join(', ')}`);
    };

    // Verify Command Path
    for (const arg of commandArgs) {
        if (arg.includes('/') || arg.includes('\\')) {
            const resolvedPath = path.resolve(WORKSPACE_ROOT, arg);
            if (!resolvedPath.startsWith(WORKSPACE_ROOT + path.sep) && resolvedPath !== WORKSPACE_ROOT) {
                throw new Error(`Invalid command: ${arg} is outside of the workspace`);
            };
        };
    };

    // Execute Command using spawn
    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        let outputTruncated = false;

        const child = spawn(commandName, commandArgs, 
            { 
                cwd: WORKSPACE_ROOT, 
                timeout: 30000,
                shell: false
            }
        );

        child.stdout.on('data', (data: Buffer) => {
            const chunk = data.toString();
            if (stdout.length + chunk.length > MAX_OUTPUT_LENGTH) {
                stdout += chunk.slice(0, MAX_OUTPUT_LENGTH - stdout.length);
                outputTruncated = true;
            } else {
                stdout += chunk;
            }
        });
    
        child.stderr.on('data', (data: Buffer) => {
            const chunk = data.toString();
            if (stderr.length + chunk.length > MAX_OUTPUT_LENGTH) {
                stderr += chunk.slice(0, MAX_OUTPUT_LENGTH - stderr.length);
                outputTruncated = true;
            } else {
                stderr += chunk;
            }
        });

        child.on('close', (code: number | null) => {
            let result = '';

            if (stdout) {
                result += stdout;
            }
            if (stderr) {
                result += (result ? '\n' : '') + `[stderr] ${stderr}`;
            }
            if (outputTruncated) {
                result += '\n...[出力が長いため省略されました。]';
            }

            if(code !==0){
                result += `\n[終了コード: ${code}]`;
            }

            resolve(result || '(出力なし)');
    
        });

        child.on('error', (err: Error) => {
            reject(new Error(`Failed to execute command: ${err.message}`));
        });
    });
}

/**
 * Tool Definition
 */
export const execCommand = {
    name: "execCommand",
    description: `ワークスペース内で許可された汎用コマンドを実行する。利用可能：bun test、ls、cat、grep、find、pwd、mkdir。`,
    needsApproval: true,
    parameters: {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: "実行するコマンド（例: 'ls -la', 'git status'）"
            }
        },
        required: ['command']
    },
    execute: execCommandExecute
};