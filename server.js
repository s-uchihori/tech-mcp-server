const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());

// MCPマニフェストを提供するエンドポイント
app.get("/manifest.json", (req, res) => {
  const manifest = {
    name: "簡単なMCPサーバー",
    version: "1.0.0",
    tools: [
      {
        name: "hello_world",
        description: "挨拶を返すシンプルなツール",
        parameters: [
          {
            name: "name",
            type: "string",
            description: "挨拶する相手の名前",
            required: true,
          },
        ],
      },
      {
        name: "calculate",
        description: "簡単な計算を行うツール",
        parameters: [
          {
            name: "operation",
            type: "string",
            description: "実行する演算（add, subtract, multiply, divide）",
            required: true,
          },
          {
            name: "a",
            type: "number",
            description: "最初の数値",
            required: true,
          },
          {
            name: "b",
            type: "number",
            description: "2番目の数値",
            required: true,
          },
        ],
      },
    ],
    resources: [
      {
        name: "help",
        description: "MCPサーバーの使用方法",
        url: "/help",
      },
    ],
  };

  res.json(manifest);
});

// ヘルプリソースを提供するエンドポイント
app.get("/help", (req, res) => {
  const helpText = `
# 簡単なMCPサーバーの使用方法

このサーバーは、Roo Codeのためのシンプルなツールを提供します。

## 利用可能なツール

### hello_world
挨拶を返すシンプルなツール
- パラメータ: name (挨拶する相手の名前)

### calculate
簡単な計算を行うツール
- パラメータ: 
  - operation (実行する演算: add, subtract, multiply, divide)
  - a (最初の数値)
  - b (2番目の数値)

## 使用例

\`\`\`
use_mcp_tool(
  name="hello_world",
  parameters={
    "name": "ユーザー"
  }
)
\`\`\`

\`\`\`
use_mcp_tool(
  name="calculate",
  parameters={
    "operation": "add",
    "a": 5,
    "b": 3
  }
)
\`\`\`
`;

  res.type("text/plain").send(helpText);
});

// ツール実行エンドポイント
app.post("/tools/:toolName", (req, res) => {
  const { toolName } = req.params;
  const parameters = req.body;

  console.log(`ツール実行リクエスト: ${toolName}`, parameters);

  switch (toolName) {
    case "hello_world":
      if (!parameters.name) {
        return res.status(400).json({ error: "nameパラメータが必要です" });
      }
      return res.json({ result: `こんにちは、${parameters.name}さん！` });

    case "calculate":
      if (!parameters.operation || !parameters.a || !parameters.b) {
        return res
          .status(400)
          .json({ error: "必要なパラメータが不足しています" });
      }

      const a = Number(parameters.a);
      const b = Number(parameters.b);

      if (isNaN(a) || isNaN(b)) {
        return res.status(400).json({ error: "数値パラメータが無効です" });
      }

      let result;
      switch (parameters.operation) {
        case "add":
          result = a + b;
          break;
        case "subtract":
          result = a - b;
          break;
        case "multiply":
          result = a * b;
          break;
        case "divide":
          if (b === 0) {
            return res.status(400).json({ error: "0で割ることはできません" });
          }
          result = a / b;
          break;
        default:
          return res.status(400).json({ error: "無効な演算です" });
      }

      return res.json({ result });

    default:
      return res
        .status(404)
        .json({ error: "指定されたツールが見つかりません" });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`MCPサーバーが起動しました: http://localhost:${PORT}`);
  console.log(`マニフェスト: http://localhost:${PORT}/manifest.json`);
  console.log(`ヘルプ: http://localhost:${PORT}/help`);
});
