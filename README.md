# Tech MCP サーバー

これは、Claude、CursorやRoo Code のための MCP サーバーです。このサーバーは、基本的なツールを提供します。

## 前提条件

- [Deno](https://deno.com/) がインストールされていること
- Denoの環境構築は[DENO_SETUP.md](https://github.com/taka-ganasu/roo-mcp-server/blob/main/DENO_SETUP.md) と [VSCODE_DENO_SETUP.md](https://github.com/taka-ganasu/roo-mcp-server/blob/main/VSCODE_DENO_SETUP.md) を参照

## 起動方法

```bash
# サーバーの起動
deno task start

# 開発モードでの起動（変更を監視して自動再起動）
deno task dev
```

## テスト実行

```bash
# テストの実行
deno task test
```

## 提供するツール （v0.6）

### 基本ツール

- getStringLength - 文字列の長さを返すツール（動作確認用）

### GitHub 関連ツール

- getGitHubRepoInfo - GitHub リポジトリの情報を取得するツール
- getGitHubRepoContents - GitHub リポジトリのコンテンツ（ファイルやディレクトリ）を取得するツール
- getGitHubIssues - GitHub リポジトリのイシューを取得するツール
- getGitHubCommits - GitHub リポジトリのコミット履歴を取得するツール
- getGitHubPullRequests - GitHub リポジトリのプルリクエストを取得するツール
- getGitHubUserInfo - 認証された GitHub ユーザーの情報を取得するツール

### JIRA 関連ツール

- getJiraProjectInfo - JIRA プロジェクトの情報を取得するツール
- getJiraIssue - JIRA チケットの情報を取得するツール
- searchJiraIssues - JQL を使用して JIRA チケットを検索するツール
- getJiraProjectIssues - JIRA プロジェクトのチケット一覧を取得するツール

### Slack 関連ツール

- slack_list_channels - Slack ワークスペースの公開チャンネル一覧を取得するツール
- slack_post_message - Slack チャンネルに新しいメッセージを投稿するツール
- slack_user_conversations - ユーザーがメンバーになっているチャンネル一覧を取得するツール
- slack_get_channel_history - チャンネル名から会話履歴を取得するツール
- slack_get_thread_replies - チャンネル名とスレッドタイムスタンプからスレッド返信を取得するツール

### インテグレーションツール

- mapGitHubPrToJiraIssues - GitHub のプルリクエストと JIRA チケットをマッピングするツール
- generateDashboardSummary - 開発状況のダッシュボードサマリーを生成するツール

## Roo Code への登録方法

1. サーバーを起動します: `deno task start`
2. Roo Cline の設定ファイルを編集します: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
3. 以下の設定を追加します:
4. env は@aka-ganasu から受け取ること

```json
{
  "mcpServers": {
    "local": {
      "command": "deno",
      "args": [
        "run",
        "--allow-net",
        "--allow-env",
        "--allow-read",
        "/path/to/src/server.ts"
      ],
      "env": {},
      "disabled": false,
      "alwaysAllow": [
        "GITHUB_TOKEN": "ghp_xxxxx"
        ...
      ]
    }
  }
}
```

4. パスを実際の src/server.ts のパスに置き換えてください
5. Roo Cline を再起動して設定を反映させます

登録後、Roo Code から提供されるツールにアクセスできるようになります。
