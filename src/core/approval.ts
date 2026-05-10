import * as readline from 'readline';

let recentApprovals: string[] = [];

async function requestApprovalWithLoopDetection(
    toolName: string,
    args: any
): Promise<boolean> {

    const currenctCall = `${toolName}:${JSON.stringify(args)}`;

    // check if the same tool call has been approved recently
    if (recentApprovals.includes(currenctCall)) {
        console.warn("\n警告: 同じツール呼び出しが最近承認されました。ループの可能性があります。"); 
    }

    recentApprovals.push(currenctCall);
    if(recentApprovals.length > 5) {
        recentApprovals.shift();
    }

    return await requestApproval(toolName, args);
}



export async function requestApproval(
    toolName: string,
    args: any
): Promise<boolean> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n--- 承認が必要です ---');
        console.log(`ツール: ${toolName}`);
        console.log(`引数: ${JSON.stringify(args, null, 2)}`);
        
        rl.question('このツールを実行しますか？ (y/n): ', (answer) => {
            rl.close();
       
            if (answer.toLowerCase() === 'y') {
                console.log('ツールが承認されました。実行します...');
                resolve(true);
            } else {
                console.log('ツールの実行が拒否されました。');
                resolve(false);
            }
        });
    });
}