export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface AsyncState {
  loading: boolean;
  mutating: boolean;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StageShape {
  _id: string;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  icon: string;
}
