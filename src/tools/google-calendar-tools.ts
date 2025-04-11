// src/tools/google-calendar-tools.ts
// Google Calendarツールの定義と実装

import { Tool } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import {
  ErrorCode,
  McpError,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import {
  GoogleCalendarCreateEventArgs,
  GoogleCalendarEventArgs,
} from "../types.ts";
import { getGoogleCalendarClient } from "../utils/google-calendar.ts";

// 共通のオプションプロパティ
const commonProperties = {
  compact: {
    type: "boolean",
    description: "Return compact data with essential fields only",
    default: true,
  },
  compact_json: {
    type: "boolean",
    description: "Return non-formatted JSON to reduce token usage",
    default: true,
  },
};

// google_calendar_get_eventsツールの定義
export const googleCalendarGetEventsTool: Tool = {
  name: "google_calendar_get_events",
  description: "指定期間のGoogle Calendarイベントを取得（フィルタ機能付き）",
  inputSchema: {
    type: "object",
    properties: {
      calendarId: {
        type: "string",
        description: "カレンダーID（デフォルトは'primary'）",
      },
      timeMin: {
        type: "string",
        description: "開始日時（ISO 8601形式、例: 2023-01-01T00:00:00Z）",
      },
      timeMax: {
        type: "string",
        description: "終了日時（ISO 8601形式、例: 2023-01-31T23:59:59Z）",
      },
      maxResults: {
        type: "number",
        description: "最大結果数（デフォルト: 10、最大: 100）",
        default: 10,
      },
      q: {
        type: "string",
        description: "検索クエリ（イベントのタイトルや説明などを検索）",
      },
      singleEvents: {
        type: "boolean",
        description: "繰り返しイベントを展開するかどうか",
        default: true,
      },
      orderBy: {
        type: "string",
        description: "並び順（startTime, updated）",
        default: "startTime",
      },
      filterByAttendees: {
        type: "boolean",
        description: "参加者が自分以外にいる予定に絞るかどうか",
        default: false,
      },
      ...commonProperties,
    },
  },
};

// google_calendar_create_eventツールの定義
export const googleCalendarCreateEventTool: Tool = {
  name: "google_calendar_create_event",
  description: "Google Calendarに新しいイベントを作成",
  inputSchema: {
    type: "object",
    properties: {
      calendarId: {
        type: "string",
        description: "カレンダーID（デフォルトは'primary'）",
      },
      summary: {
        type: "string",
        description: "イベントのタイトル",
      },
      description: {
        type: "string",
        description: "イベントの説明",
      },
      location: {
        type: "string",
        description: "イベントの場所",
      },
      start: {
        type: "object",
        description: "開始日時",
        properties: {
          dateTime: {
            type: "string",
            description:
              "開始日時（ISO 8601形式、例: 2023-01-01T10:00:00+09:00）",
          },
          timeZone: {
            type: "string",
            description: "タイムゾーン（例: Asia/Tokyo）",
          },
        },
        required: ["dateTime"],
      },
      end: {
        type: "object",
        description: "終了日時",
        properties: {
          dateTime: {
            type: "string",
            description:
              "終了日時（ISO 8601形式、例: 2023-01-01T11:00:00+09:00）",
          },
          timeZone: {
            type: "string",
            description: "タイムゾーン（例: Asia/Tokyo）",
          },
        },
        required: ["dateTime"],
      },
      attendees: {
        type: "array",
        description: "参加者リスト",
        items: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "参加者のメールアドレス",
            },
            optional: {
              type: "boolean",
              description: "任意参加かどうか",
            },
          },
          required: ["email"],
        },
      },
      reminders: {
        type: "object",
        description: "リマインダー設定",
        properties: {
          useDefault: {
            type: "boolean",
            description: "デフォルトのリマインダーを使用するかどうか",
          },
          overrides: {
            type: "array",
            description: "カスタムリマインダー",
            items: {
              type: "object",
              properties: {
                method: {
                  type: "string",
                  description: "通知方法（email, popup）",
                },
                minutes: {
                  type: "number",
                  description: "イベント開始前の通知時間（分）",
                },
              },
              required: ["method", "minutes"],
            },
          },
        },
      },
    },
    required: ["summary", "start", "end"],
  },
};

/**
 * イベントデータから必要なフィールドのみを抽出する関数
 * @param event イベントオブジェクト
 * @returns 必要なフィールドのみを含むオブジェクト
 */
function extractEventEssentialData(event: any): any {
  // 基本的なイベント情報を抽出
  const essentialData: any = {
    id: event.id,
    summary: event.summary,
    start: event.start,
    end: event.end,
    status: event.status,
  };

  // 説明があれば追加
  if (event.description) {
    essentialData.description = event.description;
  }

  // 場所があれば追加
  if (event.location) {
    essentialData.location = event.location;
  }

  // 作成日時と更新日時
  if (event.created) {
    essentialData.created = event.created;
  }
  if (event.updated) {
    essentialData.updated = event.updated;
  }

  // 参加者があれば追加（簡略化）
  if (event.attendees && event.attendees.length > 0) {
    essentialData.attendees = event.attendees.map((attendee: any) => ({
      email: attendee.email,
      responseStatus: attendee.responseStatus,
      optional: attendee.optional || false,
    }));
  }

  // リマインダーがあれば追加
  if (event.reminders && event.reminders.overrides) {
    essentialData.reminders = {
      useDefault: event.reminders.useDefault,
      overrides: event.reminders.overrides,
    };
  }

  return essentialData;
}

/**
 * google_calendar_get_eventsツールのハンドラー
 * @param args ツール引数
 * @returns ツール実行結果
 */
export async function handleGoogleCalendarGetEvents(args: unknown): Promise<{
  content: { type: string; text: string }[];
  isError: boolean;
}> {
  try {
    const typedArgs = args as GoogleCalendarEventArgs;
    const compact = typedArgs.compact !== false; // デフォルトでtrue
    const compact_json = typedArgs.compact_json !== false; // デフォルトでtrue

    const calendarClient = getGoogleCalendarClient();
    const response = await calendarClient.getEvents(
      typedArgs.calendarId || "primary",
      typedArgs.timeMin,
      typedArgs.timeMax,
      typedArgs.maxResults || 10,
      typedArgs.q,
      typedArgs.singleEvents !== false, // デフォルトでtrue
      typedArgs.orderBy || "startTime",
    );

    console.error(
      `[google_calendar_get_events] イベントを取得しました (${
        response.items?.length ?? 0
      }件)`,
    );

    // イベントのフィルタリングと加工
    let filteredItems = response.items || [];

    // 参加者に基づくフィルタリング（filterByAttendeesパラメータが指定されている場合）
    if (typedArgs.filterByAttendees && filteredItems.length > 0) {
      // 単純にattendeesプロパティを持つイベントのみをフィルタリング
      filteredItems = filteredItems.filter((event: any) => {
        return event.attendees && event.attendees.length > 0;
      });

      console.error(
        `[google_calendar_get_events] 参加者フィルタリング: ${filteredItems.length}件のイベントが該当`,
      );
    }

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact && filteredItems.length > 0) {
      filteredItems = filteredItems.map(extractEventEssentialData);
    }

    // レスポンスデータを作成
    const data: any = {
      kind: "calendar#events",
      summary: response.summary,
      items: filteredItems,
    };

    // filterByAttendeesパラメータが指定されていない場合は、追加のフィールドを含める
    if (!typedArgs.filterByAttendees) {
      Object.assign(data, {
        etag: response.etag,
        description: response.description,
        updated: response.updated,
        timeZone: response.timeZone,
        accessRole: response.accessRole,
        defaultReminders: response.defaultReminders,
      });

      // nextPageTokenがある場合は追加
      if (response.nextPageToken) {
        data.nextPageToken = response.nextPageToken;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, compact_json ? 0 : 2),
        },
      ],
      isError: false,
    };
  } catch (error) {
    console.error(
      `[ERROR] ${error instanceof Error ? error.message : String(error)}`,
    );

    return {
      content: [
        {
          type: "text",
          text: `エラーが発生しました: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * google_calendar_create_eventツールのハンドラー
 * @param args ツール引数
 * @returns ツール実行結果
 */
export async function handleGoogleCalendarCreateEvent(args: unknown): Promise<{
  content: { type: string; text: string }[];
  isError: boolean;
}> {
  try {
    const typedArgs = args as GoogleCalendarCreateEventArgs;

    if (!typedArgs.summary || !typedArgs.start || !typedArgs.end) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Missing required arguments: summary, start, and end",
      );
    }

    // イベントデータを構築
    const eventData: any = {
      summary: typedArgs.summary,
      start: typedArgs.start,
      end: typedArgs.end,
    };

    // オプションフィールドを追加
    if (typedArgs.description) eventData.description = typedArgs.description;
    if (typedArgs.location) eventData.location = typedArgs.location;
    if (typedArgs.attendees) eventData.attendees = typedArgs.attendees;
    if (typedArgs.reminders) eventData.reminders = typedArgs.reminders;

    const calendarClient = getGoogleCalendarClient();
    const response = await calendarClient.createEvent(
      eventData,
      typedArgs.calendarId || "primary",
    );

    console.error(
      `[google_calendar_create_event] イベントを作成しました (id=${response.id})`,
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
      isError: false,
    };
  } catch (error) {
    console.error(
      `[ERROR] ${error instanceof Error ? error.message : String(error)}`,
    );

    return {
      content: [
        {
          type: "text",
          text: `エラーが発生しました: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}
