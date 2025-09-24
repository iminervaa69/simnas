export interface Category {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateCategoryData {
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateCategoryData {
  category_id?: string;
  name?: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface CategoryFilters {
  is_active?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'display_order' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
}

// API Response types
export interface CategoryResponse {
  data?: Category | Category[];
  error?: string;
  message?: string;
}

export interface CategoryListResponse {
  data: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}