// src/types.ts
// 型定義

import { Tool } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";

// Slack関連の型定義
export interface SlackListChannelsArgs {
  limit?: number;
  cursor?: string;
  member_only?: boolean;
}

export interface SlackPostMessageArgs {
  channel_id: string;
  text: string;
}

export interface SlackUserConversationsArgs {
  user_id: string;
  limit?: number;
  cursor?: string;
}

export interface SlackChannelHistoryArgs {
  channel_name: string;
  limit?: number;
  cursor?: string;
  compact?: boolean;
  compact_json?: boolean;
}

export interface SlackThreadRepliesArgs {
  channel_name: string;
  thread_ts: string;
  limit?: number;
  compact?: boolean;
  compact_json?: boolean;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_member: boolean;
  is_private: boolean;
  created: number;
  is_archived: boolean;
  is_general: boolean;
  unlinked: number;
  name_normalized: string;
  is_shared: boolean;
  is_org_shared: boolean;
  is_pending_ext_shared: boolean;
  pending_shared: unknown[];
  context_team_id: string;
  updated: number;
  parent_conversation: unknown | null;
  creator: string;
  is_ext_shared: boolean;
  shared_team_ids: string[];
  pending_connected_team_ids: unknown[];
  topic: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose: {
    value: string;
    creator: string;
    last_set: number;
  };
  previous_names: string[];
  num_members: number;
  [key: string]: unknown;
}

// GitHub API関連の型定義
export interface GitHubApiHeaders {
  Accept: string;
  "User-Agent": string;
  Authorization?: string;
  [key: string]: string | undefined;
}

// JIRA API関連の型定義
export interface JiraApiHeaders {
  Accept: string;
  "Content-Type": string;
  "User-Agent": string;
  Authorization?: string;
  [key: string]: string | undefined;
}

// ツール引数の型定義
export interface StringLengthArgs {
  input: string;
}

// GitHub関連の引数型
export interface GitHubRepoArgs {
  owner: string;
  repo: string;
}

export interface GitHubRepoContentsArgs extends GitHubRepoArgs {
  path?: string;
  ref?: string;
}

export interface GitHubIssuesArgs extends GitHubRepoArgs {
  state?: string;
  per_page?: number;
}

export interface GitHubCommitsArgs extends GitHubRepoArgs {
  path?: string;
  per_page?: number;
}

export interface GitHubPullRequestsArgs extends GitHubRepoArgs {
  state?: string;
  sort?: string;
  direction?: string;
  per_page?: number;
  since?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  compact?: boolean; // コンパクトモード（デフォルトtrue）
}

// JIRA関連の引数型
export interface JiraProjectArgs {
  projectKey: string;
}

export interface JiraIssueArgs {
  issueKey: string;
}

export interface JiraSearchArgs {
  jql: string;
  maxResults?: number;
  fields?: string[];
}

export interface JiraProjectIssuesArgs extends JiraProjectArgs {
  status?: string;
  maxResults?: number;
}

// 統合ツール関連の引数型
export interface GitHubJiraIntegrationArgs extends GitHubRepoArgs {
  projectKey: string;
  since?: string;
  maxResults?: number;
}

export interface DashboardSummaryArgs {
  owner: string;
  repos: string[];
  projectKeys: string[];
  period?: string; // 'day', 'week', 'month', 'quarter', 'year'
}

// ツールレスポンスの型定義
export interface ToolResponse {
  content: {
    type: string;
    text: string;
  }[];
  isError: boolean;
}
