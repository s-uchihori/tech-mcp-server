# Deno のセットアップと実行方法

## Deno のインストール

Deno は、JavaScript と TypeScript のためのセキュアなランタイムです。以下の方法でインストールできます。

### macOS / Linux

ターミナルで以下のコマンドを実行します：

```bash
curl -fsSL https://deno.land/install.sh | sh
```

インストール後、以下のコマンドをシェルの設定ファイル（.bashrc、.zshrc など）に追加してください：

```bash
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
```

設定を反映させるには、ターミナルを再起動するか、以下のコマンドを実行します：

```bash
source ~/.bashrc  # または ~/.zshrc
```

### macOS (Homebrew)

Homebrew がインストールされている場合は、以下のコマンドでインストールできます：

```bash
brew install deno
```

### Windows

PowerShell で以下のコマンドを実行します：

```powershell
irm https://deno.land/install.ps1 | iex
```

### インストールの確認

インストールが成功したかどうかを確認するには、以下のコマンドを実行します：

```bash
deno --version
```

## MCP サーバーの実行

Deno のインストールが完了したら、以下の手順で MCP サーバーを実行できます：

1. プロジェクトディレクトリに移動します：

```bash
cd /path/to/roo-mcp-server
```

2. サーバーを起動します：

```bash
deno task start
```

開発モードで実行する場合（ファイルの変更を監視して自動再起動）：

```bash
deno task dev
```

3. テストを実行する場合：

```bash
deno task test
```

## トラブルシューティング

### パーミッションエラー

Deno はセキュリティのため、明示的な権限が必要です。権限エラーが発生した場合は、必要な権限フラグを追加してください：

- ネットワークアクセス: `--allow-net`
- ファイルシステムアクセス: `--allow-read`, `--allow-write`
- 環境変数アクセス: `--allow-env`
- すべての権限（開発時のみ推奨）: `--allow-all`

例：

```bash
deno run --allow-net --allow-env server.ts
```

### 依存関係の問題

依存関係の問題が発生した場合は、キャッシュをクリアしてみてください：

```bash
deno cache --reload server.ts
```

## 参考リンク

- [Deno 公式サイト](https://deno.com/)
- [Deno ドキュメント](https://docs.deno.com/)
- [Deno スタンダードライブラリ](https://deno.land/std)
