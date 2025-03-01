// @deno-types="npm:@modelcontextprotocol/sdk@1.5.0/types"
import { Server } from "npm:@modelcontextprotocol/sdk@1.5.0/server.js";
// @deno-types="npm:@modelcontextprotocol/sdk@1.5.0/types"
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.5.0/stdio.js";
// @deno-types="npm:@modelcontextprotocol/sdk@1.5.0/types"
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolRequest,
  ErrorCode,
  McpError,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";

const TOOLS: Tool[] = [
  {
    name: "getStringLength",
    description: "Get the length of a string",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string", description: "The input string" },
      },
      required: ["input"],
    },
  },
];
const server = new Server(
  {
    name: "local",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {
        getStringLength: TOOLS[0],
      },
    },
  }
);

server.setRequestHandler(ListResourcesRequestSchema, () => ({
  resources: [],
}));

server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, (request: CallToolRequest) => {
  const name = request.params.name;
  const args = request.params.arguments ?? {};

  try {
    switch (name) {
      case "getStringLength": {
        const input = args.input;
        if (typeof input !== "string") {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Expected input to be a string, got ${typeof input}`
          );
        }

        // Array.fromを使用して文字列の長さを正確に計算（絵文字や結合文字に対応）
        const length = Array.from(input).length;
        console.error(`[getStringLength] 入力: "${input}", 長さ: ${length}`);

        return {
          content: [
            {
              type: "text",
              text: `${length}`,
            },
          ],
          isError: false,
        };
      }
      default: {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    }
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);

    if (error instanceof McpError) {
      throw error;
    }

    return {
      content: [
        {
          type: "text",
          text: `エラーが発生しました: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// エラーハンドリング
server.onerror = (error) => {
  console.error(`[MCP Server Error] ${error.message}`);
};

// シグナルハンドリング
Deno.addSignalListener("SIGINT", async () => {
  console.error("シャットダウンシグナルを受信しました...");
  await server.close();
  Deno.exit(0);
});

// サーバー起動
console.error("MCP サーバーを起動しています...");
await server.connect(new StdioServerTransport());
console.error("MCP サーバーが stdio で実行中です");
console.error("Ctrl+C で終了します");
