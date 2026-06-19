
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const DEFAULT_PAGE = 1;
export const PAGE_SIZE_OPTIONS = [9, 18, 27, 36];
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];
