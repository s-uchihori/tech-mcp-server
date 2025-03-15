// src/tools/index.ts
// ツール定義のエクスポート

import { getStringLengthTool, handleGetStringLength } from "./string-tools.ts";
import {
  googleCalendarGetEventsTool,
  googleCalendarCreateEventTool,
  handleGoogleCalendarGetEvents,
  handleGoogleCalendarCreateEvent,
} from "./google-calendar-tools.ts";
import {
  slackListChannelsTool,
  slackPostMessageTool,
  slackUserConversationsTool,
  slackGetChannelHistoryTool,
  slackGetThreadRepliesTool,
  handleSlackListChannels,
  handleSlackPostMessage,
  handleSlackUserConversations,
  handleSlackGetChannelHistory,
  handleSlackGetThreadReplies,
} from "./slack-tools.ts";
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
import {
  getJiraProjectInfoTool,
  getJiraIssueTool,
  searchJiraIssuesTool,
  getJiraProjectIssuesTool,
  handleGetJiraProjectInfo,
  handleGetJiraIssue,
  handleSearchJiraIssues,
  handleGetJiraProjectIssues,
} from "./jira-tools.ts";
import {
  mapGitHubPrToJiraIssuesTool,
  generateDashboardSummaryTool,
  handleMapGitHubPrToJiraIssues,
  handleGenerateDashboardSummary,
} from "./integration-tools.ts";
import { Tool } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";

// すべてのツール定義
export const TOOLS: Tool[] = [
  // 文字列ツール
  getStringLengthTool,

  // GitHubツール
  getGitHubRepoInfoTool,
  getGitHubRepoContentsTool,
  getGitHubIssuesTool,
  getGitHubCommitsTool,
  getGitHubPullRequestsTool,
  getGitHubUserInfoTool,

  // JIRAツール
  getJiraProjectInfoTool,
  getJiraIssueTool,
  searchJiraIssuesTool,
  getJiraProjectIssuesTool,

  // 統合ツール
  mapGitHubPrToJiraIssuesTool,
  generateDashboardSummaryTool,

  // Slackツール
  slackListChannelsTool,
  slackPostMessageTool,
  slackUserConversationsTool,
  slackGetChannelHistoryTool,
  slackGetThreadRepliesTool,

  // Google Calendarツール
  googleCalendarGetEventsTool,
  googleCalendarCreateEventTool,
];

// ツールハンドラーのエクスポート
export {
  // 文字列ツールハンドラー
  handleGetStringLength,

  // GitHubツールハンドラー
  handleGetGitHubRepoInfo,
  handleGetGitHubRepoContents,
  handleGetGitHubIssues,
  handleGetGitHubCommits,
  handleGetGitHubPullRequests,
  handleGetGitHubUserInfo,

  // JIRAツールハンドラー
  handleGetJiraProjectInfo,
  handleGetJiraIssue,
  handleSearchJiraIssues,
  handleGetJiraProjectIssues,

  // 統合ツールハンドラー
  handleMapGitHubPrToJiraIssues,
  handleGenerateDashboardSummary,

  // Slackツールハンドラー
  handleSlackListChannels,
  handleSlackPostMessage,
  handleSlackUserConversations,
  handleSlackGetChannelHistory,
  handleSlackGetThreadReplies,

  // Google Calendarツールハンドラー
  handleGoogleCalendarGetEvents,
  handleGoogleCalendarCreateEvent,
};

// ツール名とハンドラーのマッピング
export const toolHandlers = {
  // 文字列ツール
  getStringLength: handleGetStringLength,

  // GitHubツール
  getGitHubRepoInfo: handleGetGitHubRepoInfo,
  getGitHubRepoContents: handleGetGitHubRepoContents,
  getGitHubIssues: handleGetGitHubIssues,
  getGitHubCommits: handleGetGitHubCommits,
  getGitHubPullRequests: handleGetGitHubPullRequests,
  getGitHubUserInfo: handleGetGitHubUserInfo,

  // JIRAツール
  getJiraProjectInfo: handleGetJiraProjectInfo,
  getJiraIssue: handleGetJiraIssue,
  searchJiraIssues: handleSearchJiraIssues,
  getJiraProjectIssues: handleGetJiraProjectIssues,

  // 統合ツール
  mapGitHubPrToJiraIssues: handleMapGitHubPrToJiraIssues,
  generateDashboardSummary: handleGenerateDashboardSummary,

  // Slackツール
  slack_list_channels: handleSlackListChannels,
  slack_post_message: handleSlackPostMessage,
  slack_user_conversations: handleSlackUserConversations,
  slack_get_channel_history: handleSlackGetChannelHistory,
  slack_get_thread_replies: handleSlackGetThreadReplies,

  // Google Calendarツール
  google_calendar_get_events: handleGoogleCalendarGetEvents,
  google_calendar_create_event: handleGoogleCalendarCreateEvent,
};
