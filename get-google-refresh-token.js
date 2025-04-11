// get-google-refresh-token.js
// Google OAuth 2.0のリフレッシュトークンを取得するためのスクリプト

// .envファイルから環境変数を読み込む
import dotenv from "dotenv";
import { parse } from "url";
import open from "open";
import { createServer } from "http";
import { google } from "googleapis";

// server-destroyパッケージの代わりにカスタム関数を使用
const addDestroyMethod = (server) => {
  server.destroy = () => {
    return new Promise((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  };
  return server;
};

// 環境変数を読み込む
dotenv.config();

// .envファイルから認証情報を取得
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "エラー: .envファイルにGOOGLE_CLIENT_IDとGOOGLE_CLIENT_SECRETが設定されていません。"
  );
  process.exit(1);
}

// リダイレクトURI（ローカルホスト）
const REDIRECT_URI = "http://localhost:3000/oauth2callback";

// 必要なスコープ
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

/**
 * OAuth2クライアントを作成
 */
function createOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

/**
 * 認証URLを取得
 * @param {google.auth.OAuth2} oauth2Client OAuth2クライアント
 * @returns {string} 認証URL
 */
function getAuthUrl(oauth2Client) {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // リフレッシュトークンを確実に取得するために同意画面を表示
  });
}

/**
 * コールバックを処理するHTTPサーバーを起動
 * @param {google.auth.OAuth2} oauth2Client OAuth2クライアント
 * @returns {Promise<string>} リフレッシュトークン
 */
function startHttpServer(oauth2Client) {
  return new Promise((resolve, reject) => {
    // コールバックを処理するサーバーを作成
    const server = addDestroyMethod(
      createServer(async (req, res) => {
        try {
          // リクエストURLからクエリパラメータを取得
          const queryParams = parse(req.url, true).query;
          const code = queryParams.code;

          if (code) {
            // 認証コードを使用してトークンを取得
            const { tokens } = await oauth2Client.getToken(code);

            // レスポンスを返す
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`
            <h1>認証成功！</h1>
            <p>このウィンドウは閉じて構いません。</p>
            <p>リフレッシュトークン: <code>${tokens.refresh_token}</code></p>
            <p>このトークンを.envファイルとMCPサーバーの設定ファイルに追加してください。</p>
          `);

            // サーバーを終了
            await server.destroy();

            // リフレッシュトークンを返す
            resolve(tokens.refresh_token);
          } else {
            // エラーレスポンスを返す
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end(
              "<h1>認証に失敗しました。</h1><p>もう一度お試しください。</p>"
            );

            // サーバーを終了
            await server.destroy();

            // エラーを返す
            reject(new Error("認証コードが取得できませんでした。"));
          }
        } catch (error) {
          // エラーレスポンスを返す
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end(`<h1>エラーが発生しました。</h1><p>${error.message}</p>`);

          // サーバーを終了
          await server.destroy();

          // エラーを返す
          reject(error);
        }
      })
    ).listen(3000);
  });
}

/**
 * メイン関数
 */
async function main() {
  try {
    console.log(`クライアントID: ${CLIENT_ID}`);
    console.log("クライアントシークレット: [非表示]");

    // OAuth2クライアントを作成
    const oauth2Client = createOAuth2Client();

    // 認証URLを取得
    const authUrl = getAuthUrl(oauth2Client);

    // 認証URLをブラウザで開く
    console.log("ブラウザで認証ページを開きます...");
    await open(authUrl);

    // HTTPサーバーを起動してコールバックを処理
    const refreshToken = await startHttpServer(oauth2Client);

    // 結果を表示
    console.log("\n=== リフレッシュトークンの取得に成功しました ===");
    console.log(`リフレッシュトークン: ${refreshToken}`);
    console.log("\n以下の手順でトークンを設定してください:");
    console.log("1. .envファイルのGOOGLE_REFRESH_TOKENに上記のトークンを設定");
    console.log(
      "2. MCPサーバーの設定ファイル(cline_mcp_settings.json)のGOOGLE_REFRESH_TOKENに上記のトークンを設定"
    );
    console.log("3. MCPサーバーを再起動");
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

// スクリプトを実行
main();
