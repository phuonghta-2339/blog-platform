export interface BaseResponse<T = unknown> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T = unknown> extends BaseResponse<T> {
  data: T;
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
}
