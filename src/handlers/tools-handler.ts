// src/handlers/tools-handler.ts
// ツールリクエストハンドラー

import {
  CallToolRequest,
  ErrorCode,
  ListToolsRequest,
  McpError,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import { toolHandlers, TOOLS } from "../tools/index.ts";

/**
 * ツール一覧を取得するハンドラー
 * @returns ツール一覧のレスポンス
 */
export function handleListTools(_request: ListToolsRequest) {
  return { tools: TOOLS };
}

/**
 * ツールを実行するハンドラー
 * @param request ツール実行リクエスト
 * @returns ツール実行結果
 */
export async function handleCallTool(request: CallToolRequest) {
  const name = request.params.name;
  const args = request.params.arguments ?? {};

  try {
    // ツール名に対応するハンドラーを取得
    const handler = toolHandlers[name as keyof typeof toolHandlers];

    if (!handler) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    // ハンドラーを実行
    return await handler(args);
  } catch (error) {
    console.error(
      `[ERROR] ${error instanceof Error ? error.message : String(error)}`,
    );

    if (error instanceof McpError) {
      throw error;
    }

    return {
      content: [
        {
          type: "text",
          text: `エラーが発生しました: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}
