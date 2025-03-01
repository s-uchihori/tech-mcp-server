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
  {
    name: "getGitHubRepoContents",
    description:
      "Get contents (files and directories) from a GitHub repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner (username or organization)",
        },
        repo: {
          type: "string",
          description: "Repository name",
        },
        path: {
          type: "string",
          description:
            "Path to the file or directory (default: root directory)",
          default: "",
        },
        ref: {
          type: "string",
          description:
            "The name of the commit/branch/tag (default: default branch)",
          default: "",
        },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "getGitHubIssues",
    description: "Get issues from a GitHub repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner (username or organization)",
        },
        repo: {
          type: "string",
          description: "Repository name",
        },
        state: {
          type: "string",
          description: "State of the issues (open, closed, all)",
          default: "open",
        },
        per_page: {
          type: "number",
          description: "Number of issues to return (max: 100)",
          default: 30,
        },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "getGitHubCommits",
    description: "Get commit history from a GitHub repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner (username or organization)",
        },
        repo: {
          type: "string",
          description: "Repository name",
        },
        path: {
          type: "string",
          description: "Path to filter commits by (default: all files)",
          default: "",
        },
        per_page: {
          type: "number",
          description: "Number of commits to return (max: 100)",
          default: 30,
        },
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
        getGitHubRepoContents: TOOLS[2],
        getGitHubIssues: TOOLS[3],
        getGitHubCommits: TOOLS[4],
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

          // GitHub Personal Access Tokenを環境変数から取得（設定されていない場合はundefined）
          const githubToken = Deno.env.get("GITHUB_TOKEN");

          console.error(
            `[getGitHubRepoInfo] リポジトリ情報を取得中: ${owner}/${repo}`
          );

          try {
            const headers: Record<string, string> = {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "MCP-GitHub-Tool",
            };

            // トークンが設定されている場合は、Authorizationヘッダーを追加
            if (githubToken) {
              headers["Authorization"] = `token ${githubToken}`;
              console.error(
                `[getGitHubRepoInfo] GitHub APIにトークンを使用してアクセスします`
              );
            } else {
              console.error(
                `[getGitHubRepoInfo] GitHub APIに認証なしでアクセスします（プライベートリポジトリにはアクセスできません）`
              );
            }

            const response = await fetch(
              `https://api.github.com/repos/${owner}/${repo}`,
              {
                headers,
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
        case "getGitHubRepoContents": {
          const owner = args.owner;
          const repo = args.repo;
          const path = typeof args.path === "string" ? args.path : "";
          const ref = typeof args.ref === "string" ? args.ref : "";

          if (typeof owner !== "string" || typeof repo !== "string") {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Expected owner and repo to be strings`
            );
          }

          // GitHub Personal Access Tokenを環境変数から取得
          const githubToken = Deno.env.get("GITHUB_TOKEN");

          console.error(
            `[getGitHubRepoContents] リポジトリコンテンツを取得中: ${owner}/${repo}/${path}${
              ref ? ` (ref: ${ref})` : ""
            }`
          );

          try {
            const headers: Record<string, string> = {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "MCP-GitHub-Tool",
            };

            if (githubToken) {
              headers["Authorization"] = `token ${githubToken}`;
              console.error(
                `[getGitHubRepoContents] GitHub APIにトークンを使用してアクセスします`
              );
            } else {
              console.error(
                `[getGitHubRepoContents] GitHub APIに認証なしでアクセスします（プライベートリポジトリにはアクセスできません）`
              );
            }

            // URLにクエリパラメータを追加
            let url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
            if (ref) {
              url += `?ref=${ref}`;
            }

            const response = await fetch(url, { headers });

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
        case "getGitHubIssues": {
          const owner = args.owner;
          const repo = args.repo;
          const state = typeof args.state === "string" ? args.state : "open";
          const per_page =
            typeof args.per_page === "number" ? args.per_page : 30;

          if (typeof owner !== "string" || typeof repo !== "string") {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Expected owner and repo to be strings`
            );
          }

          // GitHub Personal Access Tokenを環境変数から取得
          const githubToken = Deno.env.get("GITHUB_TOKEN");

          console.error(
            `[getGitHubIssues] イシューを取得中: ${owner}/${repo} (state: ${state}, per_page: ${per_page})`
          );

          try {
            const headers: Record<string, string> = {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "MCP-GitHub-Tool",
            };

            if (githubToken) {
              headers["Authorization"] = `token ${githubToken}`;
              console.error(
                `[getGitHubIssues] GitHub APIにトークンを使用してアクセスします`
              );
            } else {
              console.error(
                `[getGitHubIssues] GitHub APIに認証なしでアクセスします（プライベートリポジトリにはアクセスできません）`
              );
            }

            // URLにクエリパラメータを追加
            const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=${per_page}`;

            const response = await fetch(url, { headers });

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
        case "getGitHubCommits": {
          const owner = args.owner;
          const repo = args.repo;
          const path = typeof args.path === "string" ? args.path : "";
          const per_page =
            typeof args.per_page === "number" ? args.per_page : 30;

          if (typeof owner !== "string" || typeof repo !== "string") {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Expected owner and repo to be strings`
            );
          }

          // GitHub Personal Access Tokenを環境変数から取得
          const githubToken = Deno.env.get("GITHUB_TOKEN");

          console.error(
            `[getGitHubCommits] コミット履歴を取得中: ${owner}/${repo}${
              path ? ` (path: ${path})` : ""
            } (per_page: ${per_page})`
          );

          try {
            const headers: Record<string, string> = {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "MCP-GitHub-Tool",
            };

            if (githubToken) {
              headers["Authorization"] = `token ${githubToken}`;
              console.error(
                `[getGitHubCommits] GitHub APIにトークンを使用してアクセスします`
              );
            } else {
              console.error(
                `[getGitHubCommits] GitHub APIに認証なしでアクセスします（プライベートリポジトリにはアクセスできません）`
              );
            }

            // URLにクエリパラメータを追加
            let url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${per_page}`;
            if (path) {
              url += `&path=${path}`;
            }

            const response = await fetch(url, { headers });

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
