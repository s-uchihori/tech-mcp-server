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

// ツール引数の型定義
export interface StringLengthArgs {
  input: string;
}

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

// ツールレスポンスの型定義
export interface ToolResponse {
  content: {
    type: string;
    text: string;
  }[];
  isError: boolean;
}
