// src/tools/index.ts
// ツール定義のエクスポート

import { getStringLengthTool, handleGetStringLength } from "./string-tools.ts";
import {
  getGitHubRepoInfoTool,
  getGitHubRepoContentsTool,
  getGitHubIssuesTool,
  getGitHubCommitsTool,
  getGitHubPullRequestsTool,
  getGitHubUserInfoTool,
  handleGetGitHubRepoInfo,
  handleGetGitHubRepoContents,
  handleGetGitHubIssues,
  handleGetGitHubCommits,
  handleGetGitHubPullRequests,
  handleGetGitHubUserInfo,
} from "./github-tools.ts";
import { Tool } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";

// すべてのツール定義
export const TOOLS: Tool[] = [
  getStringLengthTool,
  getGitHubRepoInfoTool,
  getGitHubRepoContentsTool,
  getGitHubIssuesTool,
  getGitHubCommitsTool,
  getGitHubPullRequestsTool,
  getGitHubUserInfoTool,
];

// ツールハンドラーのエクスポート
export {
  handleGetStringLength,
  handleGetGitHubRepoInfo,
  handleGetGitHubRepoContents,
  handleGetGitHubIssues,
  handleGetGitHubCommits,
  handleGetGitHubPullRequests,
  handleGetGitHubUserInfo,
};

// ツール名とハンドラーのマッピング
export const toolHandlers = {
  getStringLength: handleGetStringLength,
  getGitHubRepoInfo: handleGetGitHubRepoInfo,
  getGitHubRepoContents: handleGetGitHubRepoContents,
  getGitHubIssues: handleGetGitHubIssues,
  getGitHubCommits: handleGetGitHubCommits,
  getGitHubPullRequests: handleGetGitHubPullRequests,
  getGitHubUserInfo: handleGetGitHubUserInfo,
};
