// src/utils/jira.ts
// JIRA API関連のユーティリティ関数

/**
 * JIRA APIのヘッダーを作成する
 * @returns JIRAのAPIリクエスト用ヘッダー
 */
export function createJiraApiHeaders(): Record<string, string> {
  // JIRA API認証情報を環境変数から取得
  const jiraEmail = Deno.env.get("JIRA_EMAIL");
  const jiraApiToken = Deno.env.get("JIRA_API_TOKEN");
  const jiraBaseUrl = Deno.env.get("JIRA_BASE_URL");

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "MCP-JIRA-Tool",
  };

  // Basic認証のためのトークンを作成
  if (jiraEmail && jiraApiToken) {
    const authToken = btoa(`${jiraEmail}:${jiraApiToken}`);
    headers["Authorization"] = `Basic ${authToken}`;

    // 簡潔なログ出力
    console.error(`[JIRA API] ${jiraEmail} でアクセスします (${jiraBaseUrl})`);
  } else {
    console.error(
      `[JIRA API] 認証情報が不足しています。JIRA_EMAIL と JIRA_API_TOKEN を設定してください。`,
    );
  }

  return headers;
}

/**
 * JIRA APIからのエラーレスポンスを処理する
 * @param error 発生したエラー
 * @returns エラーメッセージを含むレスポンスオブジェクト
 */
export function handleJiraApiError(error: unknown): {
  content: { type: string; text: string }[];
  isError: boolean;
} {
  let errorMessage = error instanceof Error ? error.message : String(error);

  // レスポンスボディがある場合は詳細情報を抽出
  if (
    error instanceof Error &&
    "response" in error &&
    (error as any).response
  ) {
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

  console.error(`[JIRA API Error] ${errorMessage}`);

  return {
    content: [
      {
        type: "text",
        text: `JIRA APIエラー: ${errorMessage}`,
      },
    ],
    isError: true,
  };
}

/**
 * JIRA APIのベースURLを取得する
 * @returns JIRA APIのベースURL
 */
export function getJiraBaseUrl(): string {
  const jiraBaseUrl = Deno.env.get("JIRA_BASE_URL");
  if (!jiraBaseUrl) {
    console.error("[JIRA API] JIRA_BASE_URL が設定されていません");
    return "";
  }

  // URLの末尾のスラッシュを削除
  return jiraBaseUrl.endsWith("/") ? jiraBaseUrl.slice(0, -1) : jiraBaseUrl;
}

/**
 * JIRAのREST API v3のエンドポイントURLを作成する
 * @param path APIパス（先頭のスラッシュは不要）
 * @returns 完全なAPIエンドポイントURL
 */
export function createJiraApiUrl(path: string): string {
  const baseUrl = getJiraBaseUrl();
  if (!baseUrl) {
    throw new Error("JIRA_BASE_URL が設定されていません");
  }

  // パスの先頭にスラッシュがある場合は削除
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;

  return `${baseUrl}/rest/api/3/${cleanPath}`;
}

/**
 * JIRAのチケットキーからプロジェクトキーを抽出する
 * @param issueKey JIRAチケットキー（例: "PROJ-123"）
 * @returns プロジェクトキー（例: "PROJ"）
 */
export function extractProjectKey(issueKey: string): string {
  const match = issueKey.match(/^([A-Z0-9]+)-\d+$/);
  return match ? match[1] : "";
}

/**
 * コミットメッセージやPRタイトルからJIRAチケットキーを抽出する
 * @param text 検索対象のテキスト
 * @returns 見つかったJIRAチケットキーの配列
 */
export function extractJiraIssueKeys(text: string): string[] {
  // JIRAチケットキーのパターン: 大文字と数字のプロジェクトキー + ハイフン + 数字
  const regex = /([A-Z0-9]+-\d+)/g;
  const matches = text.match(regex) || [];

  // 重複を削除
  return [...new Set(matches)];
}
