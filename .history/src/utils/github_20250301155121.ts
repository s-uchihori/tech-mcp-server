// src/utils/github.ts
// GitHub API関連のユーティリティ関数

import { GitHubApiHeaders } from "../types.ts";

/**
 * GitHub APIのヘッダーを作成する
 * @returns GitHubのAPIリクエスト用ヘッダー
 */
export function createGitHubApiHeaders(): GitHubApiHeaders {
  // GitHub Personal Access Tokenを環境変数から取得
  const githubToken = Deno.env.get("GITHUB_TOKEN");

  const headers: GitHubApiHeaders = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "MCP-GitHub-Tool",
  };

  // トークンが設定されている場合は、Authorizationヘッダーを追加
  if (githubToken) {
    headers["Authorization"] = `token ${githubToken}`;
    console.error(`[GitHub API] トークンを使用してアクセスします`);
  } else {
    console.error(
      `[GitHub API] 認証なしでアクセスします（プライベートリポジトリにはアクセスできません）`
    );
  }

  return headers;
}

/**
 * GitHub APIからのエラーレスポンスを処理する
 * @param error 発生したエラー
 * @returns エラーメッセージを含むレスポンスオブジェクト
 */
export function handleGitHubApiError(error: unknown): {
  content: { type: string; text: string }[];
  isError: boolean;
} {
  console.error(
    `[GitHub API Error] ${
      error instanceof Error ? error.message : String(error)
    }`
  );

  return {
    content: [
      {
        type: "text",
        text: `GitHub APIエラー: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
    ],
    isError: true,
  };
}
