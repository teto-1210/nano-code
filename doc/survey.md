# Chat Completions形式
roleとcontentのペアでメッセージ入力
```
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system",    "content": "あなたは親切なアシスタントです。" },
    { "role": "user",      "content": "日本の首都はどこですか？" },
    { "role": "assistant", "content": "東京です。" },
    { "role": "user",      "content": "人口は？" }
  ]
}
```
https://qiita.com/Tadataka_Takahashi/items/8678970abd324122085c