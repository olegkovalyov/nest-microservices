export interface PaginationInterface {
  page: number;
  pageSize: number;
}

export interface PaginatedResultInterface<T> {
  items: T[];
  total: number;
}
