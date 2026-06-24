export interface Pagination {
  currentPage: number;
  lastPage: number;
  nextPage: number | null;
  perPage: number;
  prevPage: number | null;
  total: number;
}

export type Response<T = undefined> = T extends undefined
  ? {
      message?: string;
      statusCode?: number;
    }
  : {
      data: T;
      message?: string;
      statusCode?: number;
    };

export interface PaginatedResponse<T = unknown> {
  data: T[];
  message?: string;
  pagination: Pagination;
  statusCode?: number;
}

export interface ErrorResponse {
  code?: string;
  error?: string;
  message?: string;
  statusCode?: number;
}
