// backend/admin-service/src/utils/paginate.ts — one paging contract for every admin table.
import { ADMIN_LIMITS } from "@newcondo/backend-shared";
import type { Page } from "../types";

export interface ListQuery { page: number; pageSize: number; q?: string; filter?: string }
export const skipTake = (q: ListQuery) => ({ skip: (q.page - 1) * q.pageSize, take: q.pageSize });
export const page = <T>(rows: T[], total: number, q: ListQuery): Page<T> => ({ rows, total, page: q.page, pageSize: q.pageSize });
export const DEFAULT_PAGE = { page: 1, pageSize: ADMIN_LIMITS.PAGE_SIZE };
