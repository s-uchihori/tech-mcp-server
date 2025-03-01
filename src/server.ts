// @ts-nocheck
import { Server } from "npm:@modelcontextprotocol/sdk@1.5.0/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.5.0/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";

import { TOOLS } from "./tools/index.ts";
import {
  handleListResources,
  handleListTools,
  handleCallTool,
} from "./handlers/index.ts";

// サーバーの初期化
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
        getGitHubRepoInfo: TOOLS[1],
        getGitHubRepoContents: TOOLS[2],
        getGitHubIssues: TOOLS[3],
        getGitHubCommits: TOOLS[4],
      },
    },
  }
);

// リクエストハンドラーの設定
server.setRequestHandler(ListResourcesRequestSchema, handleListResources);
server.setRequestHandler(ListToolsRequestSchema, handleListTools);
server.setRequestHandler(CallToolRequestSchema, handleCallTool);

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
