// src/types.ts
// 型定義

import { Tool } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";

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
