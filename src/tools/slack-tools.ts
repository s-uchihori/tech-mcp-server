// src/tools/slack-tools.ts
// Slackツールの定義と実装

import { Tool } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import {
  ErrorCode,
  McpError,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import {
  SlackListChannelsArgs,
  SlackPostMessageArgs,
  SlackUserConversationsArgs,
  SlackChannelHistoryArgs,
  SlackThreadRepliesArgs,
  SlackChannel,
} from "../types.ts";
import { getSlackClient } from "../utils/slack.ts";

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

// slack_list_channelsツールの定義
export const slackListChannelsTool: Tool = {
  name: "slack_list_channels",
  description: "List public channels in the Slack workspace with pagination",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description:
          "Maximum number of channels to return (default 100, max 200)",
        default: 100,
      },
      cursor: {
        type: "string",
        description: "Pagination cursor for next page of results",
      },
      member_only: {
        type: "boolean",
        description: "Only return channels where the bot is a member",
        default: false,
      },
    },
  },
};

// slack_post_messageツールの定義
export const slackPostMessageTool: Tool = {
  name: "slack_post_message",
  description: "Post a new message to a Slack channel",
  inputSchema: {
    type: "object",
    properties: {
      channel_id: {
        type: "string",
        description: "The ID of the channel to post to",
      },
      text: {
        type: "string",
        description: "The message text to post",
      },
    },
    required: ["channel_id", "text"],
  },
};

// slack_user_conversationsツールの定義
export const slackUserConversationsTool: Tool = {
  name: "slack_user_conversations",
  description: "List channels that a user is a member of",
  inputSchema: {
    type: "object",
    properties: {
      user_id: {
        type: "string",
        description: "The ID of the user to get conversations for",
      },
      limit: {
        type: "number",
        description:
          "Maximum number of channels to return (default 100, max 200)",
        default: 100,
      },
      cursor: {
        type: "string",
        description: "Pagination cursor for next page of results",
      },
    },
    required: ["user_id"],
  },
};

// slack_get_channel_historyツールの定義
export const slackGetChannelHistoryTool: Tool = {
  name: "slack_get_channel_history",
  description: "Get conversation history from a channel by name",
  inputSchema: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "The name of the channel (with or without # prefix)",
      },
      limit: {
        type: "number",
        description:
          "Maximum number of messages to return (default 10, max 100)",
        default: 10,
      },
      cursor: {
        type: "string",
        description: "Pagination cursor for next page of results",
      },
      ...commonProperties,
    },
    required: ["channel_name"],
  },
};

// slack_get_thread_repliesツールの定義
export const slackGetThreadRepliesTool: Tool = {
  name: "slack_get_thread_replies",
  description: "Get replies in a thread by channel name and thread timestamp",
  inputSchema: {
    type: "object",
    properties: {
      channel_name: {
        type: "string",
        description: "The name of the channel (with or without # prefix)",
      },
      thread_ts: {
        type: "string",
        description:
          "The timestamp of the parent message in the format '1234567890.123456'",
      },
      limit: {
        type: "number",
        description:
          "Maximum number of messages to return (default 10, max 100)",
        default: 10,
      },
      ...commonProperties,
    },
    required: ["channel_name", "thread_ts"],
  },
};

/**
 * Slackメッセージから必要なフィールドのみを抽出する関数
 * @param message Slackメッセージオブジェクト
 * @returns 必要なフィールドのみを含むオブジェクト
 */
function extractMessageEssentialData(message: any): any {
  // 基本的なメッセージ情報を抽出
  const essentialData: any = {
    user: message.user,
    text: message.text,
    ts: message.ts,
    type: message.type,
  };

  // スレッド情報があれば追加
  if (message.thread_ts) {
    essentialData.thread_ts = message.thread_ts;
    if (message.reply_count) essentialData.reply_count = message.reply_count;
  }

  // リアクションがあれば追加（簡略化）
  if (message.reactions && message.reactions.length > 0) {
    essentialData.reactions = message.reactions.map((reaction: any) => ({
      name: reaction.name,
      count: reaction.count,
    }));
  }

  // 添付ファイルがあれば追加（簡略化）
  if (message.files && message.files.length > 0) {
    essentialData.has_files = true;
    essentialData.file_count = message.files.length;
  }

  // 添付情報があれば追加（簡略化）
  if (message.attachments && message.attachments.length > 0) {
    essentialData.has_attachments = true;
    essentialData.attachment_count = message.attachments.length;
  }

  return essentialData;
}

/**
 * Slackスレッドメッセージから必要なフィールドのみを抽出する関数
 * @param message Slackメッセージオブジェクト
 * @returns 必要なフィールドのみを含むオブジェクト
 */
function extractThreadMessageEssentialData(message: any): any {
  // 基本的なメッセージ情報を抽出（スレッドメッセージ用）
  const essentialData: any = {
    user: message.user,
    text: message.text,
    ts: message.ts,
    type: message.type,
  };

  // 親メッセージかどうかを示すフラグ
  if (message.thread_ts && message.thread_ts === message.ts) {
    essentialData.is_parent = true;
  }

  // リアクションがあれば追加（簡略化）
  if (message.reactions && message.reactions.length > 0) {
    essentialData.reactions = message.reactions.map((reaction: any) => ({
      name: reaction.name,
      count: reaction.count,
    }));
  }

  // 添付ファイルがあれば追加（簡略化）
  if (message.files && message.files.length > 0) {
    essentialData.has_files = true;
    essentialData.file_count = message.files.length;
  }

  // 添付情報があれば追加（簡略化）
  if (message.attachments && message.attachments.length > 0) {
    essentialData.has_attachments = true;
    essentialData.attachment_count = message.attachments.length;
  }

  return essentialData;
}

/**
 * slack_list_channelsツールのハンドラー
 * @param args ツール引数
 * @returns ツール実行結果
 */
export async function handleSlackListChannels(args: unknown): Promise<{
  content: { type: string; text: string }[];
  isError: boolean;
}> {
  try {
    const typedArgs = args as SlackListChannelsArgs;
    const slackClient = getSlackClient();

    const response = await slackClient.getChannels(
      typedArgs.limit,
      typedArgs.cursor
    );

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error}`);
    }

    // member_onlyパラメータが指定されている場合、is_memberがtrueのチャンネルだけをフィルタリング
    let channels = response.channels as SlackChannel[];
    if (typedArgs.member_only && channels) {
      channels = channels.filter(
        (channel: SlackChannel) => channel.is_member === true
      );
      console.error(
        `[slack_list_channels] メンバーのみのチャンネルをフィルタリングしました (${channels.length}件)`
      );
    }

    console.error(
      `[slack_list_channels] ${
        channels?.length ?? 0
      }件のチャンネルを取得しました`
    );

    // 元のレスポンスを複製して、フィルタリングされたチャンネルで置き換え
    const filteredResponse = {
      ...response,
      channels: channels,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(filteredResponse, null, 2),
        },
      ],
      isError: false,
    };
  } catch (error) {
    console.error(
      `[ERROR] ${error instanceof Error ? error.message : String(error)}`
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
 * slack_post_messageツールのハンドラー
 * @param args ツール引数
 * @returns ツール実行結果
 */
export async function handleSlackPostMessage(args: unknown): Promise<{
  content: { type: string; text: string }[];
  isError: boolean;
}> {
  try {
    const typedArgs = args as SlackPostMessageArgs;

    if (!typedArgs.channel_id || !typedArgs.text) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Missing required arguments: channel_id and text"
      );
    }

    const slackClient = getSlackClient();
    const response = await slackClient.postMessage(
      typedArgs.channel_id,
      typedArgs.text
    );

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error}`);
    }

    console.error(
      `[slack_post_message] メッセージを投稿しました (channel=${typedArgs.channel_id})`
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
      `[ERROR] ${error instanceof Error ? error.message : String(error)}`
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
 * slack_user_conversationsツールのハンドラー
 * @param args ツール引数
 * @returns ツール実行結果
 */
export async function handleSlackUserConversations(args: unknown): Promise<{
  content: { type: string; text: string }[];
  isError: boolean;
}> {
  try {
    const typedArgs = args as SlackUserConversationsArgs;

    if (!typedArgs.user_id) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Missing required argument: user_id"
      );
    }

    const slackClient = getSlackClient();
    const response = await slackClient.getUserConversations(
      typedArgs.user_id,
      typedArgs.limit,
      typedArgs.cursor
    );

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error}`);
    }

    console.error(
      `[slack_user_conversations] ユーザー(${
        typedArgs.user_id
      })のチャンネル一覧を取得しました (${response.channels?.length ?? 0}件)`
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
      `[ERROR] ${error instanceof Error ? error.message : String(error)}`
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
 * slack_get_channel_historyツールのハンドラー
 * @param args ツール引数
 * @returns ツール実行結果
 */
export async function handleSlackGetChannelHistory(args: unknown): Promise<{
  content: { type: string; text: string }[];
  isError: boolean;
}> {
  try {
    const typedArgs = args as SlackChannelHistoryArgs;
    const compact = typedArgs.compact !== false; // デフォルトでtrue
    const compact_json = typedArgs.compact_json !== false; // デフォルトでtrue

    if (!typedArgs.channel_name) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Missing required argument: channel_name"
      );
    }

    const slackClient = getSlackClient();
    const response = await slackClient.getChannelHistoryByName(
      typedArgs.channel_name,
      typedArgs.limit,
      typedArgs.cursor
    );

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error}`);
    }

    console.error(
      `[slack_get_channel_history] チャンネル「${
        typedArgs.channel_name
      }」の会話履歴を取得しました (${response.messages?.length ?? 0}件)`
    );

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    let data = response;
    if (compact && response.messages) {
      data = {
        ...response,
        messages: response.messages.map(extractMessageEssentialData),
      };
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
      `[ERROR] ${error instanceof Error ? error.message : String(error)}`
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
 * slack_get_thread_repliesツールのハンドラー
 * @param args ツール引数
 * @returns ツール実行結果
 */
export async function handleSlackGetThreadReplies(args: unknown): Promise<{
  content: { type: string; text: string }[];
  isError: boolean;
}> {
  try {
    const typedArgs = args as SlackThreadRepliesArgs;
    const compact = typedArgs.compact !== false; // デフォルトでtrue
    const compact_json = typedArgs.compact_json !== false; // デフォルトでtrue

    if (!typedArgs.channel_name || !typedArgs.thread_ts) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Missing required arguments: channel_name and thread_ts"
      );
    }

    const slackClient = getSlackClient();
    const response = await slackClient.getThreadRepliesByChannelName(
      typedArgs.channel_name,
      typedArgs.thread_ts,
      typedArgs.limit
    );

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error}`);
    }

    console.error(
      `[slack_get_thread_replies] チャンネル「${
        typedArgs.channel_name
      }」のスレッド(${typedArgs.thread_ts})の返信を取得しました (${
        response.messages?.length ?? 0
      }件)`
    );

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    let data = response;
    if (compact && response.messages) {
      data = {
        ...response,
        messages: response.messages.map(extractThreadMessageEssentialData),
      };
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
      `[ERROR] ${error instanceof Error ? error.message : String(error)}`
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
