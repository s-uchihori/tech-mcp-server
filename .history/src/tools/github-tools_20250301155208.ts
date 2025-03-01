// src/tools/github-tools.ts
// GitHub関連ツールの定義と実装

import { Tool } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import {
  ErrorCode,
  McpError,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import {
  GitHubRepoArgs,
  GitHubRepoContentsArgs,
  GitHubIssuesArgs,
  GitHubCommitsArgs,
  ToolResponse,
} from "../types.ts";
import {
  createGitHubApiHeaders,
  handleGitHubApiError,
} from "../utils/github.ts";

// GitHub リポジトリ情報取得ツール
export const getGitHubRepoInfoTool: Tool = {
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
};

// GitHub リポジトリコンテンツ取得ツール
export const getGitHubRepoContentsTool: Tool = {
  name: "getGitHubRepoContents",
  description: "Get contents (files and directories) from a GitHub repository",
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
        description: "Path to the file or directory (default: root directory)",
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
};

// GitHub イシュー取得ツール
export const getGitHubIssuesTool: Tool = {
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
};

// GitHub コミット履歴取得ツール
export const getGitHubCommitsTool: Tool = {
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
};

// 引数の検証
function validateGitHubRepoArgs(args: unknown): asserts args is GitHubRepoArgs {
  const typedArgs = args as GitHubRepoArgs;
  if (
    typeof typedArgs.owner !== "string" ||
    typeof typedArgs.repo !== "string"
  ) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Expected owner and repo to be strings`
    );
  }
}

// GitHub リポジトリ情報取得ツールの実装
export async function handleGetGitHubRepoInfo(
  args: unknown
): Promise<ToolResponse> {
  validateGitHubRepoArgs(args);
  const { owner, repo } = args as GitHubRepoArgs;

  console.error(`[getGitHubRepoInfo] リポジトリ情報を取得中: ${owner}/${repo}`);

  try {
    const headers = createGitHubApiHeaders();
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
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
  } catch (error) {
    return handleGitHubApiError(error);
  }
}

// GitHub リポジトリコンテンツ取得ツールの実装
export async function handleGetGitHubRepoContents(
  args: unknown
): Promise<ToolResponse> {
  validateGitHubRepoArgs(args);
  const typedArgs = args as GitHubRepoContentsArgs;
  const { owner, repo } = typedArgs;
  const path = typeof typedArgs.path === "string" ? typedArgs.path : "";
  const ref = typeof typedArgs.ref === "string" ? typedArgs.ref : "";

  console.error(
    `[getGitHubRepoContents] リポジトリコンテンツを取得中: ${owner}/${repo}/${path}${
      ref ? ` (ref: ${ref})` : ""
    }`
  );

  try {
    const headers = createGitHubApiHeaders();

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
  } catch (error) {
    return handleGitHubApiError(error);
  }
}

// GitHub イシュー取得ツールの実装
export async function handleGetGitHubIssues(
  args: unknown
): Promise<ToolResponse> {
  validateGitHubRepoArgs(args);
  const typedArgs = args as GitHubIssuesArgs;
  const { owner, repo } = typedArgs;
  const state = typeof typedArgs.state === "string" ? typedArgs.state : "open";
  const per_page =
    typeof typedArgs.per_page === "number" ? typedArgs.per_page : 30;

  console.error(
    `[getGitHubIssues] イシューを取得中: ${owner}/${repo} (state: ${state}, per_page: ${per_page})`
  );

  try {
    const headers = createGitHubApiHeaders();

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
  } catch (error) {
    return handleGitHubApiError(error);
  }
}

// GitHub コミット履歴取得ツールの実装
export async function handleGetGitHubCommits(
  args: unknown
): Promise<ToolResponse> {
  validateGitHubRepoArgs(args);
  const typedArgs = args as GitHubCommitsArgs;
  const { owner, repo } = typedArgs;
  const path = typeof typedArgs.path === "string" ? typedArgs.path : "";
  const per_page =
    typeof typedArgs.per_page === "number" ? typedArgs.per_page : 30;

  console.error(
    `[getGitHubCommits] コミット履歴を取得中: ${owner}/${repo}${
      path ? ` (path: ${path})` : ""
    } (per_page: ${per_page})`
  );

  try {
    const headers = createGitHubApiHeaders();

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
  } catch (error) {
    return handleGitHubApiError(error);
  }
}
