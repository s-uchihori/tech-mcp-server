# 簡単な Roo MCP サーバー

これは、Roo Code のための簡単な MCP サーバーです。このサーバーは、基本的なツールとリソースを提供します。

## Node.js 版

### インストール方法

```bash
# 依存パッケージのインストール
npm install
```

### 起動方法

```bash
# サーバーの起動
npm start

# 開発モードでの起動（変更を監視して自動再起動）
npm run dev
```

サーバーは、デフォルトでポート 3000 で起動します。

## Deno 版

### 前提条件

- [Deno](https://deno.com/) がインストールされていること

### 起動方法

```bash
# サーバーの起動
deno task start

# 開発モードでの起動（変更を監視して自動再起動）
deno task dev
```

### テスト実行

```bash
# テストの実行
deno task test
```

## Node.js 版の提供するツール

### hello_world

挨拶を返すシンプルなツール

**パラメータ:**

- `name` (string, 必須): 挨拶する相手の名前

**使用例:**

```
use_mcp_tool(
  name="hello_world",
  parameters={
    "name": "ユーザー"
  }
)
```

### calculate

簡単な計算を行うツール

**パラメータ:**

- `operation` (string, 必須): 実行する演算（add, subtract, multiply, divide）
- `a` (number, 必須): 最初の数値
- `b` (number, 必須): 2 番目の数値

**使用例:**

```
use_mcp_tool(
  name="calculate",
  parameters={
    "operation": "add",
    "a": 5,
    "b": 3
  }
)
```

## Node.js 版の提供するリソース

### help

MCP サーバーの使用方法を提供します。

**アクセス方法:**

```
access_mcp_resource(name="help")
```

## Deno 版の提供するツール

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

## Roo Code への登録方法

### Node.js 版

1. サーバーを起動します: `npm start`
2. Roo Code の設定画面を開きます
3. 「MCP サーバーを追加」をクリックします
4. 以下の情報を入力します：
   - 名前: 簡単な MCP サーバー
   - URL: http://localhost:3000
   - マニフェストパス: /manifest.json
5. 「追加」をクリックして登録を完了します

### Deno 版

1. サーバーを起動します: `deno task start`
2. Roo Cline の設定ファイルを編集します: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
3. 以下の設定を追加します:

```json
{
  "mcpServers": {
    "local": {
      "command": "deno",
      "args": ["run", "--allow-net", "--allow-env", "/path/to/server.ts"],
      "env": {},
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

4. パスを実際の server.ts のパスに置き換えてください
5. Roo Cline を再起動して設定を反映させます

登録後、Roo Code から提供されるツールとリソースにアクセスできるようになります。
