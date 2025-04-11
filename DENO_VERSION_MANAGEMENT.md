# Deno のバージョン管理

Deno
を使用する際、複数のバージョンを管理したい場合や、プロジェクトごとに特定のバージョンを使用したい場合があります。以下に、Deno
のバージョン管理に使用できるツールを紹介します。

## 1. dvm (Deno Version Manager)

dvm は、Node.js の「nvm」に相当する Deno のバージョン管理ツールです。

### インストール方法

```bash
# macOS / Linux
curl -fsSL https://dvm.deno.dev | sh

# Windows (PowerShell)
irm https://dvm.deno.dev | iex
```

### 基本的な使い方

```bash
# 利用可能なDenoのバージョンを一覧表示
dvm ls-remote

# 特定のバージョンをインストール
dvm install 1.40.0

# 使用するバージョンを切り替え
dvm use 1.40.0

# 現在使用中のバージョンを表示
dvm current
```

## 2. asdf

asdf
は、複数の言語やツールのバージョンを管理できる汎用的なバージョン管理ツールです。

### インストール方法

```bash
# Homebrew (macOS)
brew install asdf

# その他のインストール方法は公式サイトを参照
# https://asdf-vm.com/guide/getting-started.html
```

### Deno プラグインのインストール

```bash
asdf plugin add deno
```

### 基本的な使い方

```bash
# 利用可能なDenoのバージョンを一覧表示
asdf list-all deno

# 特定のバージョンをインストール
asdf install deno 1.40.0

# グローバルにバージョンを設定
asdf global deno 1.40.0

# プロジェクト固有のバージョンを設定
asdf local deno 1.40.0
```

## 3. Volta

Volta は、JavaScript ツールチェーン全体を管理するツールです。

### インストール方法

```bash
# macOS / Linux
curl https://get.volta.sh | bash

# Windows (PowerShell)
iwr https://get.volta.sh -OutFile volta-install.ps1
.\volta-install.ps1
```

### 基本的な使い方

```bash
# Denoをインストール
volta install deno

# 特定のバージョンをインストール
volta install deno@1.40.0

# プロジェクト固有のバージョンを設定
volta pin deno@1.40.0
```

## 4. Deno の組み込み機能

Deno
には、`.nvmrc`に相当する機能として、`deno.json`の`"denoVersion"`フィールドがあります。これを使用すると、プロジェクトで必要な
Deno のバージョンを指定できます。

```json
{
  "denoVersion": "1.40.0"
}
```

## 推奨事項

プロジェクトの要件に応じて、以下のように選択することをお勧めします：

1. **単純な Deno のバージョン管理のみが必要な場合**: dvm を使用
2. **複数の言語やツールを管理する場合**: asdf を使用
3. **JavaScript エコシステム全体を管理する場合**: Volta を使用
4. **最小限の設定で済ませたい場合**: Deno の組み込み機能を使用

## 参考リンク

- [dvm GitHub](https://github.com/justjavac/dvm)
- [asdf](https://asdf-vm.com/)
- [Volta](https://volta.sh/)
- [Deno 公式ドキュメント](https://deno.com/manual)
