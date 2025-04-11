// src/utils/github.ts
// GitHub API関連のユーティリティ関数

/**
 * GitHub APIのヘッダーを作成する
 * @returns GitHubのAPIリクエスト用ヘッダー
 */
export function createGitHubApiHeaders(): Record<string, string> {
  // GitHub Personal Access Tokenを環境変数から取得
  const githubToken = Deno.env.get("GITHUB_TOKEN");

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "MCP-GitHub-Tool",
  };

  // トークンが設定されている場合は、Authorizationヘッダーを追加
  if (githubToken) {
    headers["Authorization"] = `token ${githubToken}`;
    // 簡潔なログ出力
    const tokenPreview = githubToken.substring(0, 8) + "...";
    console.error(
      `[GitHub API] トークン ${tokenPreview} を使用してアクセスします`,
    );
  } else {
    console.error(
      `[GitHub API] 認証なしでアクセスします（プライベートリポジトリにはアクセスできません）`,
    );
    // 注意: 環境変数GITHUB_TOKENを設定してください
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
  let errorMessage = error instanceof Error ? error.message : String(error);

  // レスポンスボディがある場合は詳細情報を抽出
  if (error instanceof Error && "response" in error && error.response) {
    const response = (error as any).response;
    if (response.body) {
      try {
        const bodyText = response.body.toString();
        errorMessage += `\nレスポンス: ${bodyText}`;
      } catch (e) {
        // ボディの解析に失敗した場合は無視
      }
    }
  }

  console.error(`[GitHub API Error] ${errorMessage}`);

  return {
    content: [
      {
        type: "text",
        text: `GitHub APIエラー: ${errorMessage}`,
      },
    ],
    isError: true,
  };
}
