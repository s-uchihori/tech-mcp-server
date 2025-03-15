// src/utils/slack.ts
// Slack APIとの通信を行うユーティリティ

/**
 * Slack APIとの通信を行うクライアントクラス
 */
export class SlackClient {
  private botHeaders: { Authorization: string; "Content-Type": string };

  /**
   * SlackClientのコンストラクタ
   * @param botToken Slackボットトークン
   */
  constructor(botToken: string) {
    this.botHeaders = {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * ワークスペースの公開チャンネル一覧を取得
   * @param limit 取得するチャンネル数（最大200）
   * @param cursor ページネーションカーソル
   * @returns チャンネル一覧のレスポンス
   */
  async getChannels(limit: number = 100, cursor?: string): Promise<any> {
    const params = new URLSearchParams({
      types: "public_channel",
      exclude_archived: "true",
      limit: Math.min(limit, 200).toString(),
    });

    const teamId = Deno.env.get("SLACK_TEAM_ID");
    if (teamId) {
      params.append("team_id", teamId);
    }

    if (cursor) {
      params.append("cursor", cursor);
    }

    console.error(`[SlackClient] チャンネル一覧を取得します (limit=${limit})`);
    const response = await fetch(
      `https://slack.com/api/conversations.list?${params}`,
      { headers: this.botHeaders }
    );

    return response.json();
  }

  /**
   * 特定のユーザーが所属しているチャンネル一覧を取得
   * @param user_id ユーザーID
   * @param limit 取得するチャンネル数（最大200）
   * @param cursor ページネーションカーソル
   * @returns チャンネル一覧のレスポンス
   */
  async getUserConversations(
    user_id: string,
    limit: number = 100,
    cursor?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      types: "public_channel",
      exclude_archived: "true",
      limit: Math.min(limit, 200).toString(),
      user: user_id,
    });

    const teamId = Deno.env.get("SLACK_TEAM_ID");
    if (teamId) {
      params.append("team_id", teamId);
    }

    if (cursor) {
      params.append("cursor", cursor);
    }

    console.error(
      `[SlackClient] ユーザー(${user_id})のチャンネル一覧を取得します (limit=${limit})`
    );
    const response = await fetch(
      `https://slack.com/api/users.conversations?${params}`,
      { headers: this.botHeaders }
    );

    return response.json();
  }

  /**
   * チャンネルにメッセージを投稿
   * @param channel_id チャンネルID
   * @param text メッセージテキスト
   * @returns 投稿結果のレスポンス
   */
  async postMessage(channel_id: string, text: string): Promise<any> {
    console.error(
      `[SlackClient] メッセージを投稿します (channel=${channel_id})`
    );
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: this.botHeaders,
      body: JSON.stringify({
        channel: channel_id,
        text: text,
      }),
    });

    return response.json();
  }

  /**
   * チャンネル名からチャンネルIDを取得
   * @param channel_name チャンネル名
   * @returns チャンネルID
   */
  async getChannelIdByName(channel_name: string): Promise<string | null> {
    // チャンネル名の先頭に#がある場合は削除
    const normalizedChannelName = channel_name.startsWith("#")
      ? channel_name.substring(1)
      : channel_name;

    // チャンネル一覧を取得
    const response = await this.getChannels(100);

    if (!response.ok || !response.channels) {
      console.error(
        `[SlackClient] チャンネル一覧の取得に失敗しました: ${
          response.error || "Unknown error"
        }`
      );
      return null;
    }

    // チャンネル名に一致するチャンネルを検索
    const channel = response.channels.find(
      (ch: any) =>
        ch.name === normalizedChannelName ||
        ch.name_normalized === normalizedChannelName
    );

    if (!channel) {
      console.error(
        `[SlackClient] チャンネル「${normalizedChannelName}」が見つかりませんでした`
      );
      return null;
    }

    return channel.id;
  }

  /**
   * チャンネルの会話履歴を取得
   * @param channel_id チャンネルID
   * @param limit 取得するメッセージ数（最大100）
   * @param cursor ページネーションカーソル
   * @returns 会話履歴のレスポンス
   */
  async getChannelHistory(
    channel_id: string,
    limit: number = 10,
    cursor?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      channel: channel_id,
      limit: Math.min(limit, 100).toString(),
    });

    if (cursor) {
      params.append("cursor", cursor);
    }

    console.error(
      `[SlackClient] チャンネル(${channel_id})の会話履歴を取得します (limit=${limit})`
    );
    const response = await fetch(
      `https://slack.com/api/conversations.history?${params}`,
      { headers: this.botHeaders }
    );

    return response.json();
  }

  /**
   * チャンネル名から会話履歴を取得
   * @param channel_name チャンネル名
   * @param limit 取得するメッセージ数（最大100）
   * @param cursor ページネーションカーソル
   * @returns 会話履歴のレスポンス
   */
  async getChannelHistoryByName(
    channel_name: string,
    limit: number = 10,
    cursor?: string
  ): Promise<any> {
    const channelId = await this.getChannelIdByName(channel_name);

    if (!channelId) {
      return {
        ok: false,
        error: `チャンネル「${channel_name}」が見つかりませんでした`,
      };
    }

    return this.getChannelHistory(channelId, limit, cursor);
  }

  /**
   * スレッド内のメッセージを取得
   * @param channel_id チャンネルID
   * @param thread_ts スレッドのタイムスタンプ
   * @param limit 取得するメッセージ数（最大100）
   * @returns スレッド内のメッセージのレスポンス
   */
  async getThreadReplies(
    channel_id: string,
    thread_ts: string,
    limit: number = 10
  ): Promise<any> {
    const params = new URLSearchParams({
      channel: channel_id,
      ts: thread_ts,
      limit: Math.min(limit, 100).toString(),
    });

    console.error(
      `[SlackClient] スレッド(${thread_ts})の返信を取得します (channel=${channel_id}, limit=${limit})`
    );
    const response = await fetch(
      `https://slack.com/api/conversations.replies?${params}`,
      { headers: this.botHeaders }
    );

    return response.json();
  }

  /**
   * チャンネル名とスレッドのタイムスタンプからスレッド内のメッセージを取得
   * @param channel_name チャンネル名
   * @param thread_ts スレッドのタイムスタンプ
   * @param limit 取得するメッセージ数（最大100）
   * @returns スレッド内のメッセージのレスポンス
   */
  async getThreadRepliesByChannelName(
    channel_name: string,
    thread_ts: string,
    limit: number = 10
  ): Promise<any> {
    const channelId = await this.getChannelIdByName(channel_name);

    if (!channelId) {
      return {
        ok: false,
        error: `チャンネル「${channel_name}」が見つかりませんでした`,
      };
    }

    return this.getThreadReplies(channelId, thread_ts, limit);
  }
}

// SlackClientのシングルトンインスタンスを作成
let slackClientInstance: SlackClient | null = null;

/**
 * SlackClientのインスタンスを取得
 * @returns SlackClientのインスタンス
 */
export function getSlackClient(): SlackClient {
  if (!slackClientInstance) {
    const botToken = Deno.env.get("SLACK_BOT_TOKEN");
    if (!botToken) {
      throw new Error("SLACK_BOT_TOKEN環境変数が設定されていません");
    }
    slackClientInstance = new SlackClient(botToken);
  }
  return slackClientInstance;
}
