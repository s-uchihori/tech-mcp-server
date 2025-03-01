# VSCode での Deno プロジェクト開発環境の設定

## VSCode での TypeScript エラー表示を解消する方法

VSCode で Deno プロジェクトを開発する際、以下のようなインポート文でエラーが表示されることがあります：

```typescript
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.5.0/server/stdio.js";
```

これは、VSCode の TypeScript 言語サービスが Deno の特殊なインポート構文（`npm:`プレフィックスなど）を理解していないことが原因です。以下の方法でこの問題を解決できます。

## 1. Deno VSCode 拡張機能のインストール

1. VSCode の拡張機能タブを開く（Cmd+Shift+X）
2. 「Deno」を検索
3. 公式の「Deno」拡張機能をインストール（denoland.vscode-deno）

## 2. ワークスペース設定の構成

`.vscode/settings.json`ファイルを作成または編集して、以下の設定を追加します：

```json
{
  "deno.enable": true,
  "deno.lint": true,
  "deno.unstable": false,
  "deno.importMap": "./deno.json",
  "deno.config": "./deno.json",
  "deno.suggest.imports.hosts": {
    "https://deno.land": true,
    "https://cdn.jsdelivr.net": true,
    "https://esm.sh": true,
    "https://npm.deno.dev": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "[javascript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "typescript.validate.enable": false,
  "javascript.validate.enable": false
}
```

この設定により：

- Deno 言語サービスが有効になります
- 標準の TypeScript/JavaScript 検証が無効になり、代わりに Deno 拡張機能が検証を行います
- インポートマップとして`deno.json`が使用されます

## 3. deno.jsonc ファイルの作成

既存の`deno.json`ファイルを`deno.jsonc`に変更し、コメントを追加できるようにします。以下のように設定を追加します：

```jsonc
{
  "tasks": {
    "start": "deno run --allow-net --allow-env server.ts",
    "dev": "deno run --watch --allow-net --allow-env server.ts",
    "test": "deno test --allow-net --allow-env --no-check"
  },
  "imports": {
    "@modelcontextprotocol/sdk/": "npm:@modelcontextprotocol/sdk@1.5.0/"
  },
  "nodeModulesDir": "auto",
  // TypeScript コンパイラオプション
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true
  }
}
```

## 4. VSCode の再起動

設定を適用するために、VSCode を再起動します。

## 5. 代替方法：型チェックを無効にする

もし上記の方法でも問題が解決しない場合、または簡単に問題を回避したい場合は、以下のコメントを各ファイルの先頭に追加することで、そのファイルの型チェックを無効にできます：

```typescript
// @ts-nocheck
```

例えば：

```typescript
// @ts-nocheck
import { Server } from "npm:@modelcontextprotocol/sdk@1.5.0/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.5.0/server/stdio.js";
// ...
```

ただし、この方法は型チェックの恩恵を受けられなくなるため、最終手段として使用することをお勧めします。

## 参考リンク

- [Deno VSCode 拡張機能](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)
- [Deno 公式ドキュメント - VSCode 設定](https://deno.land/manual@v1.40.2/getting_started/setup_your_environment#visual-studio-code)
- [Deno 公式ドキュメント - npm パッケージの使用](https://deno.land/manual@v1.40.2/node/npm_specifiers)
