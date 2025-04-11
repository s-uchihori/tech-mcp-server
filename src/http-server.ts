#!/usr/bin/env deno run --allow-net --allow-env --allow-read

import { Server } from "npm:@modelcontextprotocol/sdk@1.5.0/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.5.0/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";

// ハンドラーのインポート
import {
  handleGenerateDashboardSummary,
  handleGetGitHubCommits,
  handleGetGitHubIssues,
  handleGetGitHubPullRequests,
  handleGetGitHubRepoContents,
  handleGetGitHubRepoInfo,
  handleGetGitHubUserInfo,
  handleGetJiraIssue,
  handleGetJiraProjectInfo,
  handleGetJiraProjectIssues,
  handleGetStringLength,
  handleMapGitHubPrToJiraIssues,
  handleSearchJiraIssues,
} from "./tools/index.ts";

// ツールのインポート
import { TOOLS } from "./tools/index.ts";

// JSON-RPCリクエストを処理する関数
async function handleJsonRpcRequest(request: any) {
  try {
    const { method, params, id } = request;

    console.log(`[JSON-RPC] メソッド '${method}' が呼び出されました`);
    console.log(`パラメータ: ${JSON.stringify(params)}`);

    let result;

    switch (method) {
      case "listTools":
        console.log("[ListTools] ツール一覧が要求されました");
        result = { tools: TOOLS };
        break;

      case "callTool":
        const toolName = params.name;
        const args = params.arguments;

        console.log(`[CallTool] ツール '${toolName}' が呼び出されました`);
        console.log(`引数: ${JSON.stringify(args)}`);

        switch (toolName) {
          // 文字列ツール
          case "getStringLength":
            result = await handleGetStringLength(args);
            break;

          // GitHubツール
          case "getGitHubRepoInfo":
            result = await handleGetGitHubRepoInfo(args);
            break;
          case "getGitHubRepoContents":
            result = await handleGetGitHubRepoContents(args);
            break;
          case "getGitHubIssues":
            result = await handleGetGitHubIssues(args);
            break;
          case "getGitHubCommits":
            result = await handleGetGitHubCommits(args);
            break;
          case "getGitHubPullRequests":
            result = await handleGetGitHubPullRequests(args);
            break;
          case "getGitHubUserInfo":
            result = await handleGetGitHubUserInfo(args);
            break;

          // JIRAツール
          case "getJiraProjectInfo":
            result = await handleGetJiraProjectInfo(args);
            break;
          case "getJiraIssue":
            result = await handleGetJiraIssue(args);
            break;
          case "searchJiraIssues":
            result = await handleSearchJiraIssues(args);
            break;
          case "getJiraProjectIssues":
            result = await handleGetJiraProjectIssues(args);
            break;

          // 統合ツール
          case "mapGitHubPrToJiraIssues":
            result = await handleMapGitHubPrToJiraIssues(args);
            break;
          case "generateDashboardSummary":
            result = await handleGenerateDashboardSummary(args);
            break;

          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
        break;

      case "listResources":
        result = { resources: [] };
        break;

      case "listResourceTemplates":
        result = { resourceTemplates: [] };
        break;

      case "readResource":
        result = { contents: [] };
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    return {
      jsonrpc: "2.0",
      id,
      result,
    };
  } catch (error) {
    console.error("[Error]", error);
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// メイン関数
async function main() {
  try {
    // 環境変数の読み込み
    const githubToken = Deno.env.get("GITHUB_TOKEN");
    if (githubToken) {
      console.log("GITHUB_TOKENが正常に読み込まれました");
    } else {
      console.log("GITHUB_TOKENが設定されていません");
    }

    // HTTPサーバーの設定
    const PORT = 3000;
    console.log(`HTTPサーバーを起動しています（ポート: ${PORT}）...`);

    // HTTPサーバーの起動
    const server = Deno.serve({ port: PORT }, async (request) => {
      // CORSヘッダーの設定
      const headers = new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      });

      // OPTIONSリクエスト（プリフライトリクエスト）の処理
      if (request.method === "OPTIONS") {
        return new Response(null, { headers });
      }

      // POSTリクエスト以外は拒否
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers,
        });
      }

      try {
        // リクエストボディの解析
        const body = await request.json();
        console.log("受信したリクエスト:", JSON.stringify(body));

        // JSON-RPCリクエストの処理
        const response = await handleJsonRpcRequest(body);

        // レスポンスの返却
        return new Response(JSON.stringify(response), { status: 200, headers });
      } catch (error) {
        console.error("リクエスト処理エラー:", error);

        // エラーレスポンスの返却
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: {
              code: -32700,
              message: "Parse error",
            },
          }),
          { status: 400, headers },
        );
      }
    });

    console.log(`HTTPサーバーが http://localhost:${PORT} で実行中です`);
    console.log("Ctrl+C で終了します");

    // サーバーが終了するまで待機
    await server.finished;
  } catch (error) {
    console.error("サーバー起動エラー:", error);
    Deno.exit(1);
  }
}

// メイン関数の実行
main();
