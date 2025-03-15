// src/tools/integration-tools.ts
// GitHub と JIRA の連携ツールの定義と実装

import { Tool } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import {
  ErrorCode,
  McpError,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import {
  GitHubJiraIntegrationArgs,
  DashboardSummaryArgs,
  ToolResponse,
} from "../types.ts";
import {
  createGitHubApiHeaders,
  handleGitHubApiError,
} from "../utils/github.ts";
import {
  createJiraApiHeaders,
  createJiraApiUrl,
  extractJiraIssueKeys,
  handleJiraApiError,
} from "../utils/jira.ts";

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
  verbose: {
    type: "boolean",
    description: "Enable verbose logging",
    default: false,
  },
};

// GitHub と JIRA の連携ツール
export const mapGitHubPrToJiraIssuesTool: Tool = {
  name: "mapGitHubPrToJiraIssues",
  description:
    "Map GitHub pull requests to JIRA issues based on PR title and description",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "GitHub repository owner (username or organization)",
      },
      repo: {
        type: "string",
        description: "GitHub repository name",
      },
      projectKey: {
        type: "string",
        description: "JIRA project key to filter issues (e.g., 'PROJ')",
      },
      since: {
        type: "string",
        description:
          "Only include PRs updated after this date (ISO 8601 format)",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of PRs to process",
        default: 30,
      },
      ...commonProperties,
    },
    required: ["owner", "repo", "projectKey"],
  },
};

// 開発状況サマリー生成ツール
export const generateDashboardSummaryTool: Tool = {
  name: "generateDashboardSummary",
  description: "Generate a development status dashboard summary",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "GitHub repository owner (username or organization)",
      },
      repos: {
        type: "array",
        items: {
          type: "string",
        },
        description: "List of GitHub repository names",
      },
      projectKeys: {
        type: "array",
        items: {
          type: "string",
        },
        description: "List of JIRA project keys",
      },
      period: {
        type: "string",
        description:
          "Time period for the summary (day, week, month, quarter, year)",
        default: "month",
      },
      ...commonProperties,
    },
    required: ["owner", "repos", "projectKeys"],
  },
};

// 各データ型から必要なフィールドのみを抽出する関数

/**
 * PRとJIRAチケットのマッピング情報から必要なフィールドのみを抽出する関数
 */
function extractPrJiraMappingEssentialData(mapping: any): any {
  return {
    repository: mapping.repository,
    jira_project: mapping.jira_project,
    total_mapped_prs: mapping.total_mapped_prs,
    total_jira_issues: mapping.total_jira_issues,
    mappings: mapping.mappings.map((item: any) => ({
      pr_number: item.pr_number,
      pr_title: item.pr_title,
      pr_state: item.pr_state,
      pr_url: item.pr_url,
      pr_created_at: item.pr_created_at,
      pr_updated_at: item.pr_updated_at,
      jira_keys: item.jira_keys,
      jira_issues: item.jira_issues.map((issue: any) => ({
        key: issue.key,
        summary: issue.summary,
        status: issue.status ? issue.status.name : null,
      })),
    })),
  };
}

/**
 * ダッシュボードサマリーから必要なフィールドのみを抽出する関数
 */
function extractDashboardSummaryEssentialData(summary: any): any {
  return {
    period: summary.period,
    github_summary: {
      total_prs: summary.github_summary.total_prs,
      total_commits: summary.github_summary.total_commits,
      repositories: summary.github_summary.repositories.map((repo: any) => ({
        repo: repo.repo,
        pr_count: repo.pr_count,
        commit_count: repo.commit_count,
      })),
    },
    jira_summary: {
      total_issues: summary.jira_summary.total_issues,
      completed_issues: summary.jira_summary.completed_issues,
      completion_rate: summary.jira_summary.completion_rate,
      projects: summary.jira_summary.projects.map((project: any) => ({
        project_key: project.project_key,
        total_issues: project.total_issues,
        completed_issues: project.completed_issues,
      })),
    },
    contributor_summary: summary.contributor_summary.map(
      (contributor: any) => ({
        name: contributor.name,
        prs: contributor.prs,
        commits: contributor.commits,
        total_contributions: contributor.total_contributions,
      })
    ),
  };
}

// 共通オプションの型定義
interface CommonOptions {
  compact?: boolean;
  compact_json?: boolean;
  verbose?: boolean;
}

// 引数の検証
function validateGitHubJiraIntegrationArgs(
  args: unknown
): asserts args is GitHubJiraIntegrationArgs {
  const typedArgs = args as GitHubJiraIntegrationArgs;
  if (
    typeof typedArgs.owner !== "string" ||
    typeof typedArgs.repo !== "string" ||
    typeof typedArgs.projectKey !== "string"
  ) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Expected owner, repo, and projectKey to be strings`
    );
  }
}

function validateDashboardSummaryArgs(
  args: unknown
): asserts args is DashboardSummaryArgs {
  const typedArgs = args as DashboardSummaryArgs;
  if (
    typeof typedArgs.owner !== "string" ||
    !Array.isArray(typedArgs.repos) ||
    !Array.isArray(typedArgs.projectKeys)
  ) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Expected owner to be a string, and repos and projectKeys to be arrays`
    );
  }
}

/**
 * PRとJIRAチケットのマッピング情報を取得する
 * @param pr プルリクエスト情報
 * @returns JIRAチケットキーの配列
 */
function extractJiraKeysFromPr(pr: any): string[] {
  const title = pr.title || "";
  const body =
    typeof pr.body === "string" ? pr.body : pr.body ? "[複合形式の説明]" : "";

  // タイトルと本文からJIRAチケットキーを抽出
  const keysFromTitle = extractJiraIssueKeys(title);
  const keysFromBody = extractJiraIssueKeys(body);

  // 重複を削除して結合
  return [...new Set([...keysFromTitle, ...keysFromBody])];
}

/**
 * 日付範囲を計算する
 * @param period 期間 ('day', 'week', 'month', 'quarter', 'year')
 * @returns 開始日と終了日のISO文字列
 */
function calculateDateRange(period: string): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: Date;

  switch (period) {
    case "day":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 1);
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "quarter":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "year":
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "month":
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate,
  };
}

// GitHub PR と JIRA チケットのマッピングツールの実装
export async function handleMapGitHubPrToJiraIssues(
  args: unknown
): Promise<ToolResponse> {
  validateGitHubJiraIntegrationArgs(args);
  const typedArgs = args as GitHubJiraIntegrationArgs & CommonOptions;
  const {
    owner,
    repo,
    projectKey,
    compact = true,
    compact_json = true,
    verbose = false,
  } = typedArgs;
  const since = typedArgs.since;
  const maxResults =
    typeof typedArgs.maxResults === "number" ? typedArgs.maxResults : 30;

  if (verbose) {
    console.error(
      `[mapGitHubPrToJiraIssues] PRとJIRAチケットのマッピングを開始: ${owner}/${repo} (projectKey: ${projectKey})`
    );
  }

  try {
    // 1. GitHubからPR一覧を取得
    const githubHeaders = createGitHubApiHeaders();
    let prUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=${maxResults}`;

    if (since) {
      prUrl += `&since=${since}`;
    }

    if (verbose) {
      console.error(`[mapGitHubPrToJiraIssues] GitHub PR取得URL: ${prUrl}`);
    }

    const prResponse = await fetch(prUrl, { headers: githubHeaders });

    if (!prResponse.ok) {
      throw new Error(
        `GitHub API error: ${prResponse.status} ${prResponse.statusText}`
      );
    }

    const prs = await prResponse.json();
    if (verbose) {
      console.error(
        `[mapGitHubPrToJiraIssues] ${prs.length}件のPRを取得しました`
      );
    }

    // 2. 各PRからJIRAチケットキーを抽出
    const prJiraMapping = [];
    const allJiraKeys = new Set<string>();

    for (const pr of prs) {
      const jiraKeys = extractJiraKeysFromPr(pr);

      // プロジェクトキーでフィルタリング
      const filteredKeys = jiraKeys.filter((key) =>
        key.startsWith(`${projectKey}-`)
      );

      if (filteredKeys.length > 0) {
        prJiraMapping.push({
          pr_number: pr.number,
          pr_title: pr.title,
          pr_state: pr.state,
          pr_url: pr.html_url,
          pr_created_at: pr.created_at,
          pr_updated_at: pr.updated_at,
          pr_merged_at: pr.merged_at,
          pr_user: pr.user ? pr.user.login : null,
          jira_keys: filteredKeys,
        });

        // 全JIRAキーのセットに追加
        filteredKeys.forEach((key) => allJiraKeys.add(key));
      }
    }

    // 3. 関連するJIRAチケットの詳細情報を取得
    const jiraHeaders = createJiraApiHeaders();
    const jiraIssues: Record<string, any> = {};

    if (allJiraKeys.size > 0) {
      const jiraKeysArray = Array.from(allJiraKeys);
      const jql = `key in (${jiraKeysArray.join(",")})`;
      const jiraUrl = createJiraApiUrl("search");

      if (verbose) {
        console.error(`[mapGitHubPrToJiraIssues] JIRA検索URL: ${jiraUrl}`);
        console.error(`[mapGitHubPrToJiraIssues] JQL: ${jql}`);
      }

      const jiraResponse = await fetch(jiraUrl, {
        method: "POST",
        headers: jiraHeaders,
        body: JSON.stringify({
          jql,
          maxResults: 100,
          fields: ["summary", "status", "assignee", "priority"],
        }),
      });

      if (!jiraResponse.ok) {
        if (verbose) {
          console.error(
            `JIRA API error: ${jiraResponse.status} ${jiraResponse.statusText}`
          );
        }
        // JIRAエラーがあっても処理を続行
      } else {
        const jiraData = await jiraResponse.json();

        // チケット情報をキーでマップ化
        for (const issue of jiraData.issues || []) {
          jiraIssues[issue.key] = {
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status ? issue.fields.status.name : null,
            assignee: issue.fields.assignee
              ? issue.fields.assignee.displayName
              : null,
            priority: issue.fields.priority ? issue.fields.priority.name : null,
          };
        }
      }
    }

    // 4. 最終的なマッピング結果を作成
    let result = {
      repository: `${owner}/${repo}`,
      jira_project: projectKey,
      total_mapped_prs: prJiraMapping.length,
      total_jira_issues: allJiraKeys.size,
      mappings: prJiraMapping.map((mapping) => ({
        ...mapping,
        jira_issues: mapping.jira_keys.map((key) => jiraIssues[key] || { key }),
      })),
    };

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact) {
      result = extractPrJiraMappingEssentialData(result);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, compact_json ? 0 : 2),
        },
      ],
      isError: false,
    };
  } catch (error) {
    return handleGitHubApiError(error);
  }
}

// 開発状況サマリー生成ツールの実装
export async function handleGenerateDashboardSummary(
  args: unknown
): Promise<ToolResponse> {
  validateDashboardSummaryArgs(args);
  const typedArgs = args as DashboardSummaryArgs & CommonOptions;
  const {
    owner,
    repos,
    projectKeys,
    compact = true,
    compact_json = true,
    verbose = false,
  } = typedArgs;
  const period = typedArgs.period || "month";

  if (verbose) {
    console.error(
      `[generateDashboardSummary] 開発状況サマリーを生成中: ${owner} (repos: ${repos.join(
        ", "
      )}, projectKeys: ${projectKeys.join(", ")}, period: ${period})`
    );
  }

  try {
    // 日付範囲を計算
    const { startDate, endDate } = calculateDateRange(period);
    if (verbose) {
      console.error(
        `[generateDashboardSummary] 期間: ${startDate} から ${endDate}`
      );
    }

    // 1. GitHubデータの収集
    const githubHeaders = createGitHubApiHeaders();
    const repoStats = [];
    let totalPrs = 0;
    let totalCommits = 0;
    const contributorStats: Record<
      string,
      { prs: number; commits: number; reviews: number }
    > = {};

    // 各リポジトリのデータを収集
    for (const repo of repos) {
      if (verbose) {
        console.error(
          `[generateDashboardSummary] リポジトリデータ収集中: ${owner}/${repo}`
        );
      }

      // PRデータの取得
      const prUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=100`;
      const prResponse = await fetch(prUrl, { headers: githubHeaders });

      if (!prResponse.ok) {
        if (verbose) {
          console.error(
            `GitHub API error (PR): ${prResponse.status} ${prResponse.statusText}`
          );
        }
        continue;
      }

      const prs = await prResponse.json();

      // 期間内のPRをフィルタリング
      const filteredPrs = prs.filter((pr: any) => {
        const updatedAt = new Date(pr.updated_at);
        return (
          updatedAt >= new Date(startDate) && updatedAt <= new Date(endDate)
        );
      });

      // コミットデータの取得
      const commitUrl = `https://api.github.com/repos/${owner}/${repo}/commits?since=${startDate}&until=${endDate}&per_page=100`;
      const commitResponse = await fetch(commitUrl, { headers: githubHeaders });

      if (!commitResponse.ok) {
        if (verbose) {
          console.error(
            `GitHub API error (Commits): ${commitResponse.status} ${commitResponse.statusText}`
          );
        }
        continue;
      }

      const commits = await commitResponse.json();

      // 貢献者統計の集計
      for (const pr of filteredPrs) {
        const author = pr.user?.login;
        if (author) {
          if (!contributorStats[author]) {
            contributorStats[author] = { prs: 0, commits: 0, reviews: 0 };
          }
          contributorStats[author].prs++;
        }
      }

      for (const commit of commits) {
        const author = commit.author?.login;
        if (author) {
          if (!contributorStats[author]) {
            contributorStats[author] = { prs: 0, commits: 0, reviews: 0 };
          }
          contributorStats[author].commits++;
        }
      }

      // リポジトリ統計の追加
      repoStats.push({
        repo: `${owner}/${repo}`,
        pr_count: filteredPrs.length,
        commit_count: commits.length,
      });

      totalPrs += filteredPrs.length;
      totalCommits += commits.length;
    }

    // 2. JIRAデータの収集
    const jiraHeaders = createJiraApiHeaders();
    const jiraStats = [];
    let totalJiraIssues = 0;
    let completedJiraIssues = 0;

    // 各プロジェクトのデータを収集
    for (const projectKey of projectKeys) {
      if (verbose) {
        console.error(
          `[generateDashboardSummary] JIRAプロジェクトデータ収集中: ${projectKey}`
        );
      }

      // JQLクエリの構築
      const jql = `project = ${projectKey} AND updated >= "${
        startDate.split("T")[0]
      }" AND updated <= "${endDate.split("T")[0]}" ORDER BY updated DESC`;
      const jiraUrl = createJiraApiUrl("search");

      const jiraResponse = await fetch(jiraUrl, {
        method: "POST",
        headers: jiraHeaders,
        body: JSON.stringify({
          jql,
          maxResults: 100,
          fields: [
            "summary",
            "status",
            "assignee",
            "priority",
            "created",
            "updated",
          ],
        }),
      });

      if (!jiraResponse.ok) {
        if (verbose) {
          console.error(
            `JIRA API error: ${jiraResponse.status} ${jiraResponse.statusText}`
          );
        }
        continue;
      }

      const jiraData = await jiraResponse.json();
      const issues = jiraData.issues || [];

      // 完了したチケットをカウント
      const completed = issues.filter(
        (issue: any) =>
          issue.fields.status &&
          (issue.fields.status.name === "Done" ||
            issue.fields.status.name === "Closed" ||
            issue.fields.status.name === "Resolved")
      ).length;

      // プロジェクト統計の追加
      jiraStats.push({
        project_key: projectKey,
        total_issues: issues.length,
        completed_issues: completed,
      });

      totalJiraIssues += issues.length;
      completedJiraIssues += completed;
    }

    // 3. サマリーデータの作成
    let summary = {
      period: {
        type: period,
        start_date: startDate,
        end_date: endDate,
      },
      github_summary: {
        total_prs: totalPrs,
        total_commits: totalCommits,
        repositories: repoStats,
      },
      jira_summary: {
        total_issues: totalJiraIssues,
        completed_issues: completedJiraIssues,
        completion_rate:
          totalJiraIssues > 0
            ? ((completedJiraIssues / totalJiraIssues) * 100).toFixed(2) + "%"
            : "0%",
        projects: jiraStats,
      },
      contributor_summary: Object.entries(contributorStats)
        .map(([name, stats]) => ({
          name,
          prs: stats.prs,
          commits: stats.commits,
          reviews: stats.reviews,
          total_contributions: stats.prs + stats.commits + stats.reviews,
        }))
        .sort((a, b) => b.total_contributions - a.total_contributions),
    };

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact) {
      summary = extractDashboardSummaryEssentialData(summary);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(summary, null, compact_json ? 0 : 2),
        },
      ],
      isError: false,
    };
  } catch (error) {
    return handleGitHubApiError(error);
  }
}
