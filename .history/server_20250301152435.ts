// @ts-nocheck
import { Server } from "npm:@modelcontextprotocol/sdk@1.5.0/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.5.0/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolRequest,
  ErrorCode,
  McpError,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import { Octokit } from "npm:octokit@3.1.2";

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
  {
    name: "getGitHubRepoInfo",
    description: "Get information about a GitHub repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner (username or organization)",
        },
        repo: { type: "string", description: "Repository name" },
      },
      required: ["owner", "repo"],
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
        getGitHubRepoInfo: TOOLS[1],
      },
    },
  }
);

server.setRequestHandler(ListResourcesRequestSchema, () => ({
  resources: [],
}));

server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: TOOLS }));
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
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
        case "getGitHubRepoInfo": {
          const owner = args.owner;
          const repo = args.repo;

          if (typeof owner !== "string" || typeof repo !== "string") {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Expected owner and repo to be strings`
            );
          }

          console.error(
            `[getGitHubRepoInfo] リポジトリ情報を取得中: ${owner}/${repo}`
          );

          try {
            const response = await fetch(
              `https://api.github.com/repos/${owner}/${repo}`,
              {
                headers: {
                  Accept: "application/vnd.github.v3+json",
                  "User-Agent": "MCP-GitHub-Tool",
                },
              }
            );

            if (!response.ok) {
              throw new Error(
                `GitHub API error: ${response.status} ${response.statusText}`
              );
            }

            const data = await response.json();

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(data, null, 2),
                },
              ],
              isError: false,
            };
          } catch (fetchError) {
            console.error(
              `[GitHub API Error] ${
                fetchError instanceof Error
                  ? fetchError.message
                  : String(fetchError)
              }`
            );
            return {
              content: [
                {
                  type: "text",
                  text: `GitHub APIエラー: ${
                    fetchError instanceof Error
                      ? fetchError.message
                      : String(fetchError)
                  }`,
                },
              ],
              isError: true,
            };
          }
        }
        default: {
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      }
    } catch (error) {
      console.error(
        `[ERROR] ${error instanceof Error ? error.message : String(error)}`
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
);

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
