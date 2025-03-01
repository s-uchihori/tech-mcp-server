// src/handlers/resources-handler.ts
// リソースリクエストハンドラー

import { ListResourcesRequest } from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";

/**
 * リソース一覧を取得するハンドラー
 * @returns リソース一覧のレスポンス
 */
export function handleListResources(_request: ListResourcesRequest) {
  return {
    resources: [],
  };
}
