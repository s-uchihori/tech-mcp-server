# Roo MCP サーバー

これは、Roo Code のための MCP サーバーです。このサーバーは、基本的なツールを提供します。

## 前提条件

- [Deno](https://deno.com/) がインストールされていること

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

## 提供するツール

### getStringLength

文字列の長さを返すツール

**パラメータ:**

- `input` (string, 必須): 長さを計算する文字列

**使用例:**

```
use_mcp_tool(
  server_name="local",
  tool_name="getStringLength",
  arguments={
    "input": "こんにちは世界"
  }
)
```

### getGitHubRepoInfo

GitHub リポジトリの情報を取得するツール

**パラメータ:**

- `owner` (string, 必須): リポジトリのオーナー（ユーザー名または組織名）
- `repo` (string, 必須): リポジトリ名

**使用例:**

```
use_mcp_tool(
  server_name="local",
  tool_name="getGitHubRepoInfo",
  arguments={
    "owner": "denoland",
    "repo": "deno"
  }
)
```

### getGitHubRepoContents

GitHub リポジトリのコンテンツ（ファイルやディレクトリ）を取得するツール

**パラメータ:**

- `owner` (string, 必須): リポジトリのオーナー（ユーザー名または組織名）
- `repo` (string, 必須): リポジトリ名
- `path` (string, オプション): ファイルまたはディレクトリのパス（デフォルト: ルートディレクトリ）
- `ref` (string, オプション): コミット/ブランチ/タグの名前（デフォルト: デフォルトブランチ）

### getGitHubIssues

GitHub リポジトリのイシューを取得するツール

**パラメータ:**

- `owner` (string, 必須): リポジトリのオーナー（ユーザー名または組織名）
- `repo` (string, 必須): リポジトリ名
- `state` (string, オプション): イシューの状態（open, closed, all）（デフォルト: open）
- `per_page` (number, オプション): 取得するイシューの数（最大: 100）（デフォルト: 30）

### getGitHubCommits

GitHub リポジトリのコミット履歴を取得するツール

**パラメータ:**

- `owner` (string, 必須): リポジトリのオーナー（ユーザー名または組織名）
- `repo` (string, 必須): リポジトリ名
- `path` (string, オプション): コミットをフィルタするパス（デフォルト: すべてのファイル）
- `per_page` (number, オプション): 取得するコミットの数（最大: 100）（デフォルト: 30）

### getGitHubPullRequests

GitHub リポジトリのプルリクエストを取得するツール

**パラメータ:**

- `owner` (string, 必須): リポジトリのオーナー（ユーザー名または組織名）
- `repo` (string, 必須): リポジトリ名
- `state` (string, オプション): プルリクエストの状態（open, closed, all）（デフォルト: open）
- `sort` (string, オプション): 結果のソート方法（created, updated, popularity, long-running）（デフォルト: created）
- `direction` (string, オプション): ソートの方向（asc, desc）（デフォルト: desc）
- `per_page` (number, オプション): 取得するプルリクエストの数（最大: 100）（デフォルト: 10）
- `since` (string, オプション): 指定した日時以降に更新されたプルリクエストのみを取得（ISO 8601 形式、例: 2023-01-01T00:00:00Z）
- `created_after` (string, オプション): 指定した日時以降に作成されたプルリクエストのみを取得（ISO 8601 形式）
- `created_before` (string, オプション): 指定した日時以前に作成されたプルリクエストのみを取得（ISO 8601 形式）
- `updated_after` (string, オプション): 指定した日時以降に更新されたプルリクエストのみを取得（ISO 8601 形式）
- `updated_before` (string, オプション): 指定した日時以前に更新されたプルリクエストのみを取得（ISO 8601 形式）
- `compact` (boolean, オプション): 必須フィールドのみのコンパクトなデータを返す（デフォルト: true）

**使用例:**

```
use_mcp_tool(
  server_name="local",
  tool_name="getGitHubPullRequests",
  arguments={
    "owner": "denoland",
    "repo": "deno",
    "state": "open",
    "sort": "updated",
    "per_page": 5
  }
)
```

### getGitHubUserInfo

認証された GitHub ユーザーの情報を取得するツール

**パラメータ:**

- なし

**使用例:**

```
use_mcp_tool(
  server_name="local",
  tool_name="getGitHubUserInfo",
  arguments={}
)
```

## JIRA 関連ツール

### getJiraProjectInfo

JIRA プロジェクトの情報を取得するツール

**パラメータ:**

- `projectKey` (string, 必須): JIRA プロジェクトキー（例: 'PROJ'）

**使用例:**

```
use_mcp_tool(
  server_name="local",
  tool_name="getJiraProjectInfo",
  arguments={
    "projectKey": "PROJ"
  }
)
```

### getJiraIssue

JIRA チケットの情報を取得するツール

**パラメータ:**

- `issueKey` (string, 必須): JIRA チケットキー（例: 'PROJ-123'）

**使用例:**

```
use_mcp_tool(
  server_name="local",
  tool_name="getJiraIssue",
  arguments={
    "issueKey": "PROJ-123"
  }
)
```

### searchJiraIssues

JQL を使用して JIRA チケットを検索するツール

**パラメータ:**

- `jql` (string, 必須): JQL クエリ文字列
- `maxResults` (number, オプション): 取得する結果の最大数（デフォルト: 50）
- `fields` (array, オプション): レスポンスに含めるフィールド

**使用例:**

```
use_mcp_tool(
  server_name="local",
  tool_name="searchJiraIssues",
  arguments={
    "jql": "project = PROJ AND status = 'In Progress'",
    "maxResults": 20
  }
)
```

### getJiraProjectIssues

JIRA プロジェクトのチケット一覧を取得するツール

**パラメータ:**

- `projectKey` (string, 必須): JIRA プロジェクトキー（例: 'PROJ'）
- `status` (string, オプション): ステータスでフィルタリング（例: 'Done', 'In Progress'）
- `maxResults` (number, オプション): 取得する結果の最大数（デフォルト: 50）

**使用例:**

```
use_mcp_tool(
  server_name="local",
  tool_name="getJiraProjectIssues",
  arguments={
    "projectKey": "PROJ",
    "status": "In Progress",
    "maxResults": 30
  }
)
```

## インテグレーションツール

### mapGitHubPrToJiraIssues

GitHub のプルリクエストと JIRA チケットをマッピングするツール

**パラメータ:**

- `owner` (string, 必須): GitHub リポジトリのオーナー（ユーザー名または組織名）
- `repo` (string, 必須): GitHub リポジトリ名
- `projectKey` (string, 必須): フィルタリングする JIRA プロジェクトキー（例: 'PROJ'）
- `since` (string, オプション): 指定した日時以降に更新された PR のみを含める（ISO 8601 形式）
- `maxResults` (number, オプション): 処理する PR の最大数（デフォルト: 30）

**使用例:**

```
use_mcp_tool(
  server_name="local",
  tool_name="mapGitHubPrToJiraIssues",
  arguments={
    "owner": "denoland",
    "repo": "deno",
    "projectKey": "PROJ",
    "maxResults": 20
  }
)
```

### generateDashboardSummary

開発状況のダッシュボードサマリーを生成するツール

**パラメータ:**

- `owner` (string, 必須): GitHub リポジトリのオーナー（ユーザー名または組織名）
- `repos` (array, 必須): GitHub リポジトリ名のリスト
- `projectKeys` (array, 必須): JIRA プロジェクトキーのリスト
- `period` (string, オプション): サマリーの期間（day, week, month, quarter, year）（デフォルト: month）

**使用例:**

```
use_mcp_tool(
  server_name="local",
  tool_name="generateDashboardSummary",
  arguments={
    "owner": "denoland",
    "repos": ["deno", "deno_std"],
    "projectKeys": ["PROJ", "DOC"],
    "period": "month"
  }
)
```

## Roo Code への登録方法

1. サーバーを起動します: `deno task start`
2. Roo Cline の設定ファイルを編集します: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
3. 以下の設定を追加します:

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
      "alwaysAllow": []
    }
  }
}
```

4. パスを実際の src/server.ts のパスに置き換えてください
5. Roo Cline を再起動して設定を反映させます

登録後、Roo Code から提供されるツールにアクセスできるようになります。
