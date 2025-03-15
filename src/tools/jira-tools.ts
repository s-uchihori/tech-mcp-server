// src/tools/jira-tools.ts
// JIRA関連ツールの定義と実装

import { Tool } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import {
  ErrorCode,
  McpError,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import {
  JiraProjectArgs,
  JiraIssueArgs,
  JiraSearchArgs,
  JiraProjectIssuesArgs,
  ToolResponse,
} from "../types.ts";
import {
  createJiraApiHeaders,
  createJiraApiUrl,
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
  include_pagination: {
    type: "boolean",
    description: "Include pagination information in the response",
    default: false,
  },
  verbose: {
    type: "boolean",
    description: "Enable verbose logging",
    default: false,
  },
};

// JIRA プロジェクト情報取得ツール
export const getJiraProjectInfoTool: Tool = {
  name: "getJiraProjectInfo",
  description: "Get information about a JIRA project",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "JIRA project key (e.g., 'PROJ')",
      },
      ...commonProperties,
    },
    required: ["projectKey"],
  },
};

// JIRA チケット情報取得ツール
export const getJiraIssueTool: Tool = {
  name: "getJiraIssue",
  description: "Get information about a JIRA issue",
  inputSchema: {
    type: "object",
    properties: {
      issueKey: {
        type: "string",
        description: "JIRA issue key (e.g., 'PROJ-123')",
      },
      ...commonProperties,
    },
    required: ["issueKey"],
  },
};

// JIRA チケット検索ツール
export const searchJiraIssuesTool: Tool = {
  name: "searchJiraIssues",
  description: "Search for JIRA issues using JQL",
  inputSchema: {
    type: "object",
    properties: {
      jql: {
        type: "string",
        description: "JQL query string",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results to return",
        default: 50,
      },
      fields: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Fields to include in the response",
      },
      ...commonProperties,
    },
    required: ["jql"],
  },
};

// JIRA プロジェクトのチケット一覧取得ツール
export const getJiraProjectIssuesTool: Tool = {
  name: "getJiraProjectIssues",
  description: "Get issues for a JIRA project",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "JIRA project key (e.g., 'PROJ')",
      },
      status: {
        type: "string",
        description: "Filter issues by status (e.g., 'Done', 'In Progress')",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results to return",
        default: 50,
      },
      ...commonProperties,
    },
    required: ["projectKey"],
  },
};

// 各データ型から必要なフィールドのみを抽出する関数

/**
 * プロジェクト情報から必要なフィールドのみを抽出する関数
 */
function extractProjectEssentialData(project: any): any {
  return {
    id: project.id,
    key: project.key,
    name: project.name,
    description: project.description,
    lead: project.lead ? { displayName: project.lead.displayName } : null,
    url: project.self,
    projectCategory: project.projectCategory
      ? { name: project.projectCategory.name }
      : null,
    issueTypes: project.issueTypes
      ? project.issueTypes.map((type: any) => ({ name: type.name }))
      : [],
  };
}

/**
 * チケット情報から必要なフィールドのみを抽出する関数
 */
function extractIssueEssentialData(issue: any): any {
  return {
    id: issue.id,
    key: issue.key,
    summary: issue.fields?.summary,
    description: issue.fields?.description
      ? typeof issue.fields.description === "string"
        ? issue.fields.description.substring(0, 200) +
          (issue.fields.description.length > 200 ? "..." : "")
        : "[複合形式の説明]" // オブジェクト形式の説明の場合
      : null,
    status: issue.fields?.status ? { name: issue.fields.status.name } : null,
    priority: issue.fields?.priority
      ? { name: issue.fields.priority.name }
      : null,
    assignee: issue.fields?.assignee
      ? { displayName: issue.fields.assignee.displayName }
      : null,
    reporter: issue.fields?.reporter
      ? { displayName: issue.fields.reporter.displayName }
      : null,
    created: issue.fields?.created,
    updated: issue.fields?.updated,
    labels: issue.fields?.labels || [],
    issueType: issue.fields?.issuetype
      ? { name: issue.fields.issuetype.name }
      : null,
  };
}

/**
 * 検索結果から必要なフィールドのみを抽出する関数
 */
function extractSearchResultEssentialData(searchResult: any): any {
  return {
    total: searchResult.total,
    issues: searchResult.issues
      ? searchResult.issues.map(extractIssueEssentialData)
      : [],
  };
}

/**
 * レスポンスにページネーション情報を追加する関数（オプション付き）
 */
function addPaginationInfo(
  data: any,
  startAt: number,
  maxResults: number,
  total: number,
  includePagination: boolean = false
): any {
  if (!includePagination) {
    return data;
  }

  if (data.issues) {
    return {
      ...data,
      pagination: {
        startAt: startAt,
        maxResults: maxResults,
        total: total,
        pageCount: Math.ceil(total / maxResults),
        currentPage: Math.floor(startAt / maxResults) + 1,
      },
    };
  }
  return data;
}

// 共通オプションの型定義
interface CommonOptions {
  compact?: boolean;
  compact_json?: boolean;
  include_pagination?: boolean;
  verbose?: boolean;
}

// 引数の検証
function validateJiraProjectArgs(
  args: unknown
): asserts args is JiraProjectArgs {
  const typedArgs = args as JiraProjectArgs;
  if (typeof typedArgs.projectKey !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Expected projectKey to be a string`
    );
  }
}

function validateJiraIssueArgs(args: unknown): asserts args is JiraIssueArgs {
  const typedArgs = args as JiraIssueArgs;
  if (typeof typedArgs.issueKey !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Expected issueKey to be a string`
    );
  }
}

function validateJiraSearchArgs(args: unknown): asserts args is JiraSearchArgs {
  const typedArgs = args as JiraSearchArgs;
  if (typeof typedArgs.jql !== "string") {
    throw new McpError(ErrorCode.InvalidParams, `Expected jql to be a string`);
  }
}

// JIRA プロジェクト情報取得ツールの実装
export async function handleGetJiraProjectInfo(
  args: unknown
): Promise<ToolResponse> {
  validateJiraProjectArgs(args);
  const typedArgs = args as JiraProjectArgs & CommonOptions;
  const {
    projectKey,
    compact = true,
    compact_json = true,
    verbose = false,
  } = typedArgs;

  if (verbose) {
    console.error(
      `[getJiraProjectInfo] プロジェクト情報を取得中: ${projectKey}`
    );
  }

  try {
    const headers = createJiraApiHeaders();
    const url = createJiraApiUrl(`project/${projectKey}`);

    if (verbose) {
      console.error(`[getJiraProjectInfo] リクエストURL: ${url}`);
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(
        `JIRA API error: ${response.status} ${response.statusText}`
      );
      (error as any).response = {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      };
      throw error;
    }

    let data = await response.json();

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact) {
      data = extractProjectEssentialData(data);
    }

    if (verbose) {
      console.error(
        `[getJiraProjectInfo] 成功: プロジェクト情報を取得しました`
      );
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
    return handleJiraApiError(error);
  }
}

// JIRA チケット情報取得ツールの実装
export async function handleGetJiraIssue(args: unknown): Promise<ToolResponse> {
  validateJiraIssueArgs(args);
  const typedArgs = args as JiraIssueArgs & CommonOptions;
  const {
    issueKey,
    compact = true,
    compact_json = true,
    verbose = false,
  } = typedArgs;

  if (verbose) {
    console.error(`[getJiraIssue] チケット情報を取得中: ${issueKey}`);
  }

  try {
    const headers = createJiraApiHeaders();
    const url = createJiraApiUrl(`issue/${issueKey}`);

    if (verbose) {
      console.error(`[getJiraIssue] リクエストURL: ${url}`);
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(
        `JIRA API error: ${response.status} ${response.statusText}`
      );
      (error as any).response = {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      };
      throw error;
    }

    let data = await response.json();

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact) {
      data = extractIssueEssentialData(data);
    }

    if (verbose) {
      console.error(`[getJiraIssue] 成功: チケット情報を取得しました`);
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
    return handleJiraApiError(error);
  }
}

// JIRA チケット検索ツールの実装
export async function handleSearchJiraIssues(
  args: unknown
): Promise<ToolResponse> {
  validateJiraSearchArgs(args);
  const typedArgs = args as JiraSearchArgs & CommonOptions;
  const {
    jql,
    compact = true,
    compact_json = true,
    include_pagination = false,
    verbose = false,
  } = typedArgs;
  const maxResults =
    typeof typedArgs.maxResults === "number" ? typedArgs.maxResults : 50;
  const fields = Array.isArray(typedArgs.fields) ? typedArgs.fields : undefined;

  if (verbose) {
    console.error(
      `[searchJiraIssues] JQLで検索中: ${jql} (maxResults: ${maxResults})`
    );
  }

  try {
    const headers = createJiraApiHeaders();
    const url = createJiraApiUrl("search");

    if (verbose) {
      console.error(`[searchJiraIssues] リクエストURL: ${url}`);
    }

    // リクエストボディの作成
    const requestBody = {
      jql,
      maxResults,
      fields,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(
        `JIRA API error: ${response.status} ${response.statusText}`
      );
      (error as any).response = {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      };
      throw error;
    }

    let data = await response.json();

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact) {
      data = extractSearchResultEssentialData(data);
    }

    // ページネーション情報を追加
    if (include_pagination) {
      data = addPaginationInfo(
        data,
        0,
        maxResults,
        data.total,
        include_pagination
      );
    }

    if (verbose) {
      console.error(
        `[searchJiraIssues] 成功: ${data.total}件のチケットが見つかりました`
      );
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
    return handleJiraApiError(error);
  }
}

// JIRA プロジェクトのチケット一覧取得ツールの実装
export async function handleGetJiraProjectIssues(
  args: unknown
): Promise<ToolResponse> {
  validateJiraProjectArgs(args);
  const typedArgs = args as JiraProjectIssuesArgs & CommonOptions;
  const {
    projectKey,
    compact = true,
    compact_json = true,
    include_pagination = false,
    verbose = false,
  } = typedArgs;
  const status =
    typeof typedArgs.status === "string" ? typedArgs.status : undefined;
  const maxResults =
    typeof typedArgs.maxResults === "number" ? typedArgs.maxResults : 50;

  // JQLクエリの構築
  let jql = `project = ${projectKey}`;
  if (status) {
    jql += ` AND status = "${status}"`;
  }
  jql += ` ORDER BY created DESC`;

  if (verbose) {
    console.error(
      `[getJiraProjectIssues] プロジェクトのチケットを取得中: ${projectKey} (status: ${
        status || "すべて"
      }, maxResults: ${maxResults})`
    );
  }

  try {
    const headers = createJiraApiHeaders();
    const url = createJiraApiUrl("search");

    if (verbose) {
      console.error(`[getJiraProjectIssues] リクエストURL: ${url}`);
      console.error(`[getJiraProjectIssues] JQL: ${jql}`);
    }

    // リクエストボディの作成
    const requestBody = {
      jql,
      maxResults,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(
        `JIRA API error: ${response.status} ${response.statusText}`
      );
      (error as any).response = {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      };
      throw error;
    }

    let data = await response.json();

    // コンパクトモードが有効な場合、必要なフィールドのみを抽出
    if (compact) {
      data = extractSearchResultEssentialData(data);
    }

    // ページネーション情報を追加
    if (include_pagination) {
      data = addPaginationInfo(
        data,
        0,
        maxResults,
        data.total,
        include_pagination
      );
    }

    if (verbose) {
      console.error(
        `[getJiraProjectIssues] 成功: ${data.total}件のチケットが見つかりました`
      );
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
    return handleJiraApiError(error);
  }
}
