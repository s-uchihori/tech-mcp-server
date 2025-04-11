// src/tools/index.ts
// ツール定義のエクスポート

import { getStringLengthTool, handleGetStringLength } from "./string-tools.ts";
import {
  googleCalendarCreateEventTool,
  googleCalendarGetEventsTool,
  handleGoogleCalendarCreateEvent,
  handleGoogleCalendarGetEvents,
} from "./google-calendar-tools.ts";
import {
  handleSlackGetChannelHistory,
  handleSlackGetThreadReplies,
  handleSlackListChannels,
  handleSlackPostMessage,
  handleSlackUserConversations,
  slackGetChannelHistoryTool,
  slackGetThreadRepliesTool,
  slackListChannelsTool,
  slackPostMessageTool,
  slackUserConversationsTool,
} from "./slack-tools.ts";
import {
  getGitHubCommitsTool,
  getGitHubIssuesTool,
  getGitHubPullRequestsTool,
  getGitHubRepoContentsTool,
  getGitHubRepoInfoTool,
  getGitHubUserInfoTool,
  handleGetGitHubCommits,
  handleGetGitHubIssues,
  handleGetGitHubPullRequests,
  handleGetGitHubRepoContents,
  handleGetGitHubRepoInfo,
  handleGetGitHubUserInfo,
} from "./github-tools.ts";
import {
  getJiraIssueTool,
  getJiraProjectInfoTool,
  getJiraProjectIssuesTool,
  handleGetJiraIssue,
  handleGetJiraProjectInfo,
  handleGetJiraProjectIssues,
  handleSearchJiraIssues,
  searchJiraIssuesTool,
} from "./jira-tools.ts";
import {
  generateDashboardSummaryTool,
  handleGenerateDashboardSummary,
  handleMapGitHubPrToJiraIssues,
  mapGitHubPrToJiraIssuesTool,
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
  handleGenerateDashboardSummary,
  handleGetGitHubCommits,
  handleGetGitHubIssues,
  handleGetGitHubPullRequests,
  handleGetGitHubRepoContents,
  // GitHubツールハンドラー
  handleGetGitHubRepoInfo,
  handleGetGitHubUserInfo,
  handleGetJiraIssue,
  // JIRAツールハンドラー
  handleGetJiraProjectInfo,
  handleGetJiraProjectIssues,
  // 文字列ツールハンドラー
  handleGetStringLength,
  handleGoogleCalendarCreateEvent,
  // Google Calendarツールハンドラー
  handleGoogleCalendarGetEvents,
  // 統合ツールハンドラー
  handleMapGitHubPrToJiraIssues,
  handleSearchJiraIssues,
  handleSlackGetChannelHistory,
  handleSlackGetThreadReplies,
  // Slackツールハンドラー
  handleSlackListChannels,
  handleSlackPostMessage,
  handleSlackUserConversations,
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
