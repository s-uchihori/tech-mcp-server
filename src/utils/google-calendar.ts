// src/utils/google-calendar.ts
// Google Calendar APIとの通信を行うユーティリティ

/**
 * Google Calendar APIとの通信を行うクライアントクラス
 */
export class GoogleCalendarClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;

  /**
   * GoogleCalendarClientのコンストラクタ
   * @param clientId Google APIのクライアントID
   * @param clientSecret Google APIのクライアントシークレット
   * @param refreshToken リフレッシュトークン
   */
  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
  }

  /**
   * アクセストークンを取得または更新
   * @returns アクセストークン
   */
  private async getAccessToken(): Promise<string> {
    // トークンが有効期限内であれば再利用
    const now = Date.now();
    if (this.accessToken && this.tokenExpiry > now) {
      return this.accessToken;
    }

    console.error("[GoogleCalendarClient] アクセストークンを更新します");

    // リフレッシュトークンを使用して新しいアクセストークンを取得
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(
        `トークン更新エラー: ${tokenData.error || "Unknown error"}`,
      );
    }

    // アクセストークンと有効期限を保存
    this.accessToken = tokenData.access_token;
    // 有効期限は少し短めに設定（安全マージン）
    this.tokenExpiry = now + (tokenData.expires_in - 300) * 1000;

    // この時点でthis.accessTokenはnullではないことを保証
    return this.accessToken as string;
  }

  /**
   * Google Calendar APIにリクエストを送信
   * @param endpoint APIエンドポイント
   * @param method HTTPメソッド
   * @param body リクエストボディ（オプション）
   * @returns APIレスポンス
   */
  private async request(
    endpoint: string,
    method: string = "GET",
    body?: any,
  ): Promise<any> {
    const token = await this.getAccessToken();
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3${endpoint}`,
      options,
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Google Calendar API エラー: ${data.error?.message || "Unknown error"}`,
      );
    }

    return data;
  }

  /**
   * カレンダーイベントを取得
   * @param calendarId カレンダーID（デフォルトは'primary'）
   * @param timeMin 開始日時（ISO 8601形式）
   * @param timeMax 終了日時（ISO 8601形式）
   * @param maxResults 最大結果数
   * @param q 検索クエリ
   * @param singleEvents 繰り返しイベントを展開するかどうか
   * @param orderBy 並び順
   * @returns イベント一覧
   */
  async getEvents(
    calendarId: string = "primary",
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 10,
    q?: string,
    singleEvents: boolean = true,
    orderBy: string = "startTime",
  ): Promise<any> {
    const params = new URLSearchParams();

    if (timeMin) params.append("timeMin", timeMin);
    if (timeMax) params.append("timeMax", timeMax);
    if (maxResults) params.append("maxResults", maxResults.toString());
    if (q) params.append("q", q);
    if (singleEvents) params.append("singleEvents", singleEvents.toString());
    if (orderBy) params.append("orderBy", orderBy);

    console.error(
      `[GoogleCalendarClient] イベントを取得します (calendarId=${calendarId}, maxResults=${maxResults})`,
    );

    return this.request(
      `/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    );
  }

  /**
   * カレンダーイベントを作成
   * @param event イベントデータ
   * @param calendarId カレンダーID（デフォルトは'primary'）
   * @returns 作成されたイベント
   */
  async createEvent(event: any, calendarId: string = "primary"): Promise<any> {
    console.error(
      `[GoogleCalendarClient] イベントを作成します (calendarId=${calendarId}, summary=${event.summary})`,
    );

    return this.request(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      "POST",
      event,
    );
  }

  /**
   * カレンダー一覧を取得
   * @returns カレンダー一覧
   */
  async getCalendarList(): Promise<any> {
    console.error("[GoogleCalendarClient] カレンダー一覧を取得します");
    return this.request("/users/me/calendarList");
  }
}

// GoogleCalendarClientのシングルトンインスタンスを作成
let googleCalendarClientInstance: GoogleCalendarClient | null = null;

/**
 * GoogleCalendarClientのインスタンスを取得
 * @returns GoogleCalendarClientのインスタンス
 */
export function getGoogleCalendarClient(): GoogleCalendarClient {
  if (!googleCalendarClientInstance) {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        "Google Calendar API用の環境変数が設定されていません（GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN）",
      );
    }

    googleCalendarClientInstance = new GoogleCalendarClient(
      clientId,
      clientSecret,
      refreshToken,
    );
  }

  return googleCalendarClientInstance;
}
