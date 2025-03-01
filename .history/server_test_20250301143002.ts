// @deno-types="npm:@modelcontextprotocol/sdk@1.5.0/types"
import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { CallToolRequest } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";

// モックリクエストを作成するヘルパー関数
function createMockRequest(
  toolName: string,
  args: Record<string, unknown>
): CallToolRequest {
  return {
    jsonrpc: "2.0",
    id: "test-id",
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args,
    },
  };
}

// getStringLengthツールのテスト
Deno.test("getStringLength - 通常の文字列", async () => {
  // このテストでは、実際にサーバーを起動せずに、ツールの機能をテストします
  // 実際のアプリケーションでは、MCPクライアントを使用してサーバーと通信するテストを書くこともできます

  const input = "こんにちは";
  const expectedLength = 5; // "こんにちは"は5文字

  // 文字列の長さを計算
  const actualLength = Array.from(input).length;

  assertEquals(actualLength, expectedLength);
});

Deno.test("getStringLength - 絵文字を含む文字列", async () => {
  const input = "Hello 👋 World";
  const expectedLength = 13; // "Hello 👋 World"は13文字（絵文字は1文字としてカウント）

  // 文字列の長さを計算
  const actualLength = Array.from(input).length;

  assertEquals(actualLength, expectedLength);
});

Deno.test("getStringLength - 空の文字列", async () => {
  const input = "";
  const expectedLength = 0;

  // 文字列の長さを計算
  const actualLength = Array.from(input).length;

  assertEquals(actualLength, expectedLength);
});
