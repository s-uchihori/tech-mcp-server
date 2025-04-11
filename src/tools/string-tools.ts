// src/tools/string-tools.ts
// 文字列関連ツールの定義

import { Tool } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import { StringLengthArgs } from "../types.ts";
import {
  ErrorCode,
  McpError,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";

// getStringLengthツールの定義
export const getStringLengthTool: Tool = {
  name: "getStringLength",
  description: "Get the length of a string",
  inputSchema: {
    type: "object",
    properties: {
      input: { type: "string", description: "The input string" },
    },
    required: ["input"],
  },
};

// getStringLengthツールの実装
export async function handleGetStringLength(args: unknown): Promise<{
  content: { type: string; text: string }[];
  isError: boolean;
}> {
  const typedArgs = args as StringLengthArgs;
  const input = typedArgs.input;

  if (typeof input !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Expected input to be a string, got ${typeof input}`,
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
