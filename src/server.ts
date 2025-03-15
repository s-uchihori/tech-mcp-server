// @ts-nocheck
import { Server } from "npm:@modelcontextprotocol/sdk@1.5.0/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.5.0/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import { load } from "https://deno.land/std/dotenv/mod.ts";

// .envファイルから環境変数を読み込む
try {
  // .envファイルを読み込む
  const envText = await Deno.readTextFile("./.env");

  // dotenvモジュールを使用して環境変数を読み込む
  await load({ export: true, defaults: false });

  // 環境変数が正しく設定されているか確認
  const githubToken = Deno.env.get("GITHUB_TOKEN");
  if (githubToken) {
    console.error("GITHUB_TOKENが正常に読み込まれました");
  } else {
    console.error("警告: GITHUB_TOKENが見つかりません");

    // 手動で環境変数を設定（重要：これを削除すると404エラーが発生する可能性があります）
    const tokenFromEnvFile = envText
      .split("\n")
      .find((line) => line.startsWith("GITHUB_TOKEN="))
      ?.split("=")[1];

    if (tokenFromEnvFile) {
      Deno.env.set("GITHUB_TOKEN", tokenFromEnvFile);
      console.error("GITHUB_TOKENを手動で設定しました");
    }
  }
} catch (error) {
  console.error(".envファイルの読み込みに失敗しました:", error);
}

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
        // 文字列ツール
        getStringLength: TOOLS[0],

        // GitHubツール
        getGitHubRepoInfo: TOOLS[1],
        getGitHubRepoContents: TOOLS[2],
        getGitHubIssues: TOOLS[3],
        getGitHubCommits: TOOLS[4],
        getGitHubPullRequests: TOOLS[5],
        getGitHubUserInfo: TOOLS[6],

        // JIRAツール
        getJiraProjectInfo: TOOLS[7],
        getJiraIssue: TOOLS[8],
        searchJiraIssues: TOOLS[9],
        getJiraProjectIssues: TOOLS[10],

        // 統合ツール
        mapGitHubPrToJiraIssues: TOOLS[11],
        generateDashboardSummary: TOOLS[12],
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
