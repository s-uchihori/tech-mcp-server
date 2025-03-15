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
  GitHubPullRequestsArgs,
  ToolResponse,
} from "../types.ts";
import {
  createGitHubApiHeaders,
  handleGitHubApiError,
} from "../utils/github.ts";

// 共通のオプションプロパティ
const commonProperties = {
  compact: {
    type: "boolean",
    description: "Return compact data with essential fields only",
    default: true,
  },
  compact_json: {
    type: "boolean",
    description: "Return non-formatted JSON to reduce token usage",
    default: true,
  },
  include_pagination: {
    type: "boolean",
    description: "Include pagination information in the response",
    default: false,
  },
  verbose: {
    type: "boolean",
    description: "Enable verbose logging",
    default: false,
  },
};

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
      ...commonProperties,
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
      ...commonProperties,
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
      ...commonProperties,
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
      ...commonProperties,
    },
    required: ["owner", "repo"],
  },
};

// GitHub プルリクエスト取得ツール
export const getGitHubPullRequestsTool: Tool = {
  name: "getGitHubPullRequests",
  description: "Get pull requests from a GitHub repository",
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
        description: "State of the pull requests (open, closed, all)",
        default: "open",
      },
      sort: {
        type: "string",
        description:
          "What to sort results by (created, updated, popularity, long-running)",
        default: "created",
      },
      direction: {
        type: "string",
        description: "Direction to sort (asc or desc)",
        default: "desc",
      },
      per_page: {
        type: "number",
        description: "Number of pull requests to return (max: 100)",
        default: 10, // 30から10に変更
      },
      since: {
        type: "string",
        description:
          "Only show pull requests updated at or after this time (ISO 8601 format, e.g. 2023-01-01T00:00:00Z)",
      },
      created_after: {
        type: "string",
        description:
          "Only show pull requests created at or after this time (ISO 8601 format, e.g. 2023-01-01T00:00:00Z)",
      },
      created_before: {
        type: "string",
        description:
          "Only show pull requests created at or before this time (ISO 8601 format, e.g. 2023-01-01T00:00:00Z)",
      },
      updated_after: {
        type: "string",
        description:
          "Only show pull requests updated at or after this time (ISO 8601 format, e.g. 2023-01-01T00:00:00Z)",
      },
      updated_before: {
        type: "string",
        description:
          "Only show pull requests updated at or before this time (ISO 8601 format, e.g. 2023-01-01T00:00:00Z)",
      },
      // compactはすでに存在するので、他の共通プロパティのみを追加
      compact_json: commonProperties.compact_json,
      include_pagination: commonProperties.include_pagination,
      verbose: commonProperties.verbose,
    },
    required: ["owner", "repo"],
  },
};

// GitHub 認証ユーザー情報取得ツール
export const getGitHubUserInfoTool: Tool = {
  name: "getGitHubUserInfo",
  description: "Get information about the authenticated GitHub user",
  inputSchema: {
    type: "object",
    properties: {
      ...commonProperties,
    },
    required: [],
  },
};

// 各データ型から必要なフィールドのみを抽出する関数

/**
 * リポジトリ情報から必要なフィールドのみを抽出する関数
 */
function extractRepoEssentialData(repo: any): any {
  return {
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    language: repo.language,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    open_issues_count: repo.open_issues_count,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    default_branch: repo.default_branch,
    visibility: repo.visibility,
  };
}

/**
 * リポジトリコンテンツから必要なフィールドのみを抽出する関数
 */
function extractContentsEssentialData(content: any): any {
  // 配列の場合（ディレクトリ内容）
  if (Array.isArray(content)) {
    return content.map((item) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      html_url: item.html_url,
      download_url: item.download_url,
    }));
  }

  // 単一ファイルの場合
  return {
    name: content.name,
    path: content.path,
    type: content.type,
    size: content.size,
    html_url: content.html_url,
    download_url: content.download_url,
    content: content.content, // エンコードされたコンテンツ
    encoding: content.encoding,
  };
}

/**
 * イシューから必要なフィールドのみを抽出する関数
 */
function extractIssueEssentialData(issue: any): any {
  return {
    number: issue.number,
    title: issue.title,
    state: issue.state,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    html_url: issue.html_url,
    user: issue.user ? { login: issue.user.login } : null,
    body: issue.body
      ? typeof issue.body === "string"
        ? issue.body.substring(0, 200) + (issue.body.length > 200 ? "..." : "")
        : "[複合形式の説明]" // オブジェクト形式の説明の場合
      : null, // 本文を短縮
    labels: issue.labels ? issue.labels.map((label: any) => label.name) : [],
    comments: issue.comments,
  };
}

/**
 * コミットから必要なフィールドのみを抽出する関数
 */
function extractCommitEssentialData(commit: any): any {
  return {
    sha: commit.sha,
    html_url: commit.html_url,
    commit: {
      message: commit.commit.message,
      author: commit.commit.author,
      committer: commit.commit.committer,
    },
    author: commit.author ? { login: commit.author.login } : null,
    committer: commit.committer ? { login: commit.committer.login } : null,
  };
}

/**
 * ユーザー情報から必要なフィールドのみを抽出する関数
 */
function extractUserEssentialData(user: any): any {
  return {
    login: user.login,
    name: user.name,
    html_url: user.html_url,
    avatar_url: user.avatar_url,
    bio: user.bio,
    public_repos: user.public_repos,
    followers: user.followers,
    following: user.following,
    created_at: user.created_at,
  };
}

/**
 * レスポンスにページネーション情報を追加する関数（オプション付き）
 */
function addPaginationInfo(
  data: any,
  page: number,
  per_page: number,
  includePagination: boolean = false
): any {
  if (!includePagination) {
    return data;
  }

  if (Array.isArray(data)) {
    return {
      items: data,
      pagination: {
        page: page,
        per_page: per_page,
        total_items: data.length >= per_page ? "unknown" : data.length,
      },
    };
  } else if (data.items) {
    return {
      ...data,
      pagination: {
        page: page,
        per_page: per_page,
        total_items: data.total_count,
      },
    };
  }
  return data;
}

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

// 共通オプションの型定義
interface CommonOptions {
  compact?: boolean;
  compact_json?: boolean;
  include_pagination?: boolean;
  verbose?: boolean;
}

// GitHub リポジトリ情報取得ツールの実装
export async function handleGetGitHubRepoInfo(
  args: unknown
): Promise<ToolResponse> {
  validateGitHubRepoArgs(args);
  const typedArgs = args as GitHubRepoArgs & CommonOptions;
  const {
    owner,
    repo,
    compact = true,
    compact_json = true,
    verbose = false,
  } = typedArgs;

  if (verbose) {
    console.error(
      `[getGitHubRepoInfo] リポジトリ情報を取得中: ${owner}/${repo}`
    );
  }

  try {
    const headers = createGitHubApiHeaders();
    if (verbose) {
      console.error(
        `[getGitHubRepoInfo] リクエストURL: https://api.github.com/repos/${owner}/${repo}`
      );
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
      (error as any).response = {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      };
      throw error;
    }

    let data = await response.json();

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact) {
      data = extractRepoEssentialData(data);
    }

    if (verbose) {
      console.error(`[getGitHubRepoInfo] 成功: リポジトリ情報を取得しました`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, compact_json ? 0 : 2),
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
  const typedArgs = args as GitHubRepoContentsArgs & CommonOptions;
  const {
    owner,
    repo,
    compact = true,
    compact_json = true,
    include_pagination = false,
    verbose = false,
  } = typedArgs;
  const path = typeof typedArgs.path === "string" ? typedArgs.path : "";
  const ref = typeof typedArgs.ref === "string" ? typedArgs.ref : "";

  if (verbose) {
    console.error(
      `[getGitHubRepoContents] リポジトリコンテンツを取得中: ${owner}/${repo}/${path}${
        ref ? ` (ref: ${ref})` : ""
      }`
    );
  }

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

    let data = await response.json();

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact) {
      data = extractContentsEssentialData(data);
    }

    // ページネーション情報を追加（配列の場合のみ）
    if (Array.isArray(data) && include_pagination) {
      data = addPaginationInfo(data, 1, data.length, include_pagination);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, compact_json ? 0 : 2),
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
  const typedArgs = args as GitHubIssuesArgs & CommonOptions;
  const {
    owner,
    repo,
    compact = true,
    compact_json = true,
    include_pagination = false,
    verbose = false,
  } = typedArgs;
  const state = typeof typedArgs.state === "string" ? typedArgs.state : "open";
  const per_page =
    typeof typedArgs.per_page === "number" ? typedArgs.per_page : 30;

  if (verbose) {
    console.error(
      `[getGitHubIssues] イシューを取得中: ${owner}/${repo} (state: ${state}, per_page: ${per_page})`
    );
  }

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

    let data = await response.json();

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact) {
      data = data.map(extractIssueEssentialData);
    }

    // ページネーション情報を追加
    data = addPaginationInfo(data, 1, per_page, include_pagination);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, compact_json ? 0 : 2),
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
  const typedArgs = args as GitHubCommitsArgs & CommonOptions;
  const {
    owner,
    repo,
    compact = true,
    compact_json = true,
    include_pagination = false,
    verbose = false,
  } = typedArgs;
  const path = typeof typedArgs.path === "string" ? typedArgs.path : "";
  const per_page =
    typeof typedArgs.per_page === "number" ? typedArgs.per_page : 30;

  if (verbose) {
    console.error(
      `[getGitHubCommits] コミット履歴を取得中: ${owner}/${repo}${
        path ? ` (path: ${path})` : ""
      } (per_page: ${per_page})`
    );
  }

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

    let data = await response.json();

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact) {
      data = data.map(extractCommitEssentialData);
    }

    // ページネーション情報を追加
    data = addPaginationInfo(data, 1, per_page, include_pagination);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, compact_json ? 0 : 2),
        },
      ],
      isError: false,
    };
  } catch (error) {
    return handleGitHubApiError(error);
  }
}

/**
 * PRから必要な基本データのみを抽出する関数
 * @param pr プルリクエストオブジェクト
 * @returns 必要なフィールドのみを含むオブジェクト
 */
function extractPrEssentialData(pr: any): any {
  return {
    number: pr.number,
    title: pr.title,
    state: pr.state,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    merged_at: pr.merged_at,
    user: pr.user ? { login: pr.user.login } : null,
    additions: pr.additions,
    deletions: pr.deletions,
    changed_files: pr.changed_files,
    labels: pr.labels ? pr.labels.map((label: any) => label.name) : [],
    html_url: pr.html_url,
  };
}

/**
 * PRデータをフィルタリングする関数
 * @param data APIレスポンスデータ
 * @returns フィルタリングされたデータ
 */
function filterPullRequestData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(extractPrEssentialData);
  } else if (data.items) {
    // 検索APIの結果
    return {
      total_count: data.total_count,
      items: data.items.map(extractPrEssentialData),
    };
  }
  return data;
}

// GitHub プルリクエスト取得ツールの実装
export async function handleGetGitHubPullRequests(
  args: unknown
): Promise<ToolResponse> {
  validateGitHubRepoArgs(args);
  const typedArgs = args as GitHubPullRequestsArgs & CommonOptions;
  const { owner, repo } = typedArgs;
  const state = typeof typedArgs.state === "string" ? typedArgs.state : "open";
  const sort = typeof typedArgs.sort === "string" ? typedArgs.sort : "created";
  const direction =
    typeof typedArgs.direction === "string" ? typedArgs.direction : "desc";
  const per_page =
    typeof typedArgs.per_page === "number" ? typedArgs.per_page : 10; // デフォルト値を10に変更
  const since = typedArgs.since;
  const created_after = typedArgs.created_after;
  const created_before = typedArgs.created_before;
  const updated_after = typedArgs.updated_after;
  const updated_before = typedArgs.updated_before;

  // 共通オプション
  const compact = typedArgs.compact !== false; // デフォルトでtrue
  const compact_json = typedArgs.compact_json !== false; // デフォルトでtrue
  const include_pagination = typedArgs.include_pagination === true; // デフォルトでfalse
  const verbose = typedArgs.verbose === true; // デフォルトでfalse

  // ページ番号（将来的な拡張用）
  const page = 1;

  if (verbose) {
    // 日時フィルタリングパラメータのログ出力
    let filterLog = "";
    if (since) filterLog += `, since: ${since}`;
    if (created_after) filterLog += `, created_after: ${created_after}`;
    if (created_before) filterLog += `, created_before: ${created_before}`;
    if (updated_after) filterLog += `, updated_after: ${updated_after}`;
    if (updated_before) filterLog += `, updated_before: ${updated_before}`;
    if (compact) filterLog += `, compact: ${compact}`;
    if (compact_json) filterLog += `, compact_json: ${compact_json}`;
    if (include_pagination)
      filterLog += `, include_pagination: ${include_pagination}`;

    console.error(
      `[getGitHubPullRequests] プルリクエストを取得中: ${owner}/${repo} (state: ${state}, sort: ${sort}, direction: ${direction}, per_page: ${per_page}${filterLog})`
    );
  }

  try {
    const headers = createGitHubApiHeaders();

    // 日時フィルタリングが指定されている場合は検索APIを使用
    if (created_after || created_before || updated_after || updated_before) {
      // 検索クエリの構築
      let query = `repo:${owner}/${repo} is:pr`;

      // PRの状態を追加
      if (state !== "all") {
        query += ` state:${state}`;
      }

      // 作成日時フィルタを追加
      if (created_after) {
        const date = new Date(created_after);
        query += ` created:>=${date.toISOString().split("T")[0]}`;
      }
      if (created_before) {
        const date = new Date(created_before);
        query += ` created:<=${date.toISOString().split("T")[0]}`;
      }

      // 更新日時フィルタを追加
      if (updated_after) {
        const date = new Date(updated_after);
        query += ` updated:>=${date.toISOString().split("T")[0]}`;
      }
      if (updated_before) {
        const date = new Date(updated_before);
        query += ` updated:<=${date.toISOString().split("T")[0]}`;
      }

      // 検索APIのURLを構築
      const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(
        query
      )}&sort=${sort}&order=${direction}&per_page=${per_page}`;

      if (verbose) {
        console.error(`[getGitHubPullRequests] 検索APIを使用: ${searchUrl}`);
      }

      const response = await fetch(searchUrl, { headers });

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // データをフィルタリングして必要なフィールドのみを返す
      let processedData = data;
      if (compact) {
        processedData = filterPullRequestData(data);
      }

      // ページネーション情報を追加
      processedData = addPaginationInfo(
        processedData,
        page,
        per_page,
        include_pagination
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(processedData, null, compact_json ? 0 : 2),
          },
        ],
        isError: false,
      };
    } else {
      // 標準のPR取得APIを使用
      let url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&sort=${sort}&direction=${direction}&per_page=${per_page}`;

      // since パラメータが指定されている場合は追加
      if (since) {
        url += `&since=${since}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // データをフィルタリングして必要なフィールドのみを返す
      let processedData = data;
      if (compact) {
        processedData = filterPullRequestData(data);
      }

      // ページネーション情報を追加
      processedData = addPaginationInfo(
        processedData,
        page,
        per_page,
        include_pagination
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(processedData, null, compact_json ? 0 : 2),
          },
        ],
        isError: false,
      };
    }
  } catch (error) {
    return handleGitHubApiError(error);
  }
}

// GitHub 認証ユーザー情報取得ツールの実装
export async function handleGetGitHubUserInfo(
  args: unknown
): Promise<ToolResponse> {
  const typedArgs = args as CommonOptions;
  const { compact = true, compact_json = true, verbose = false } = typedArgs;

  if (verbose) {
    console.error(`[getGitHubUserInfo] 認証ユーザー情報を取得中`);
  }

  try {
    const headers = createGitHubApiHeaders();

    // 認証ユーザー情報を取得
    const response = await fetch("https://api.github.com/user", { headers });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
      (error as any).response = {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      };
      throw error;
    }

    let data = await response.json();

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact) {
      data = extractUserEssentialData(data);
    }

    if (verbose) {
      console.error(
        `[getGitHubUserInfo] 成功: ユーザー '${data.login}' の情報を取得しました`
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, compact_json ? 0 : 2),
        },
      ],
      isError: false,
    };
  } catch (error) {
    return handleGitHubApiError(error);
  }
}
