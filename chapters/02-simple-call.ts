
// interface ChatCompletionMessage {
//     role: "system" | "user" | "assistant";
//     content: string;
// }

async function callOpenAI() {
    const response = await fetch('https://api.openai.com/v1/chat/completions', 
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-5-mini",
                messages: [
                    { role: "user", content: "TypeScriptについて簡潔に説明してください." },
                ]
            })
        }
    );

    // [CHECK] dataの型がunkown
    const data = await response.json();
    // for debug
    // console.log(data);
    console.log(data.choices[0].message.content);

}

callOpenAI();