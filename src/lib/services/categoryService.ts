import { query } from '../database/connection';

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
  search?: string; // Search in name or description
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

// CREATE - Add new category
export async function createCategory(categoryData: CreateCategoryData): Promise<Category> {
  const { 
    category_id, 
    name, 
    description, 
    image_url, 
    display_order, 
    is_active = true 
  } = categoryData;

  // Check if category_id already exists
  const existingCategory = await query(
    'SELECT id FROM categories WHERE category_id = $1 AND deleted_at IS NULL',
    [category_id]
  );

  if (existingCategory.rows.length > 0) {
    throw new Error(`Category with ID '${category_id}' already exists`);
  }

  const result = await query(
    `INSERT INTO categories (category_id, name, description, image_url, display_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [category_id, name, description, image_url, display_order, is_active]
  );

  return result.rows[0];
}

// READ - Get category by ID
export async function getCategoryById(id: string): Promise<Category | null> {
  const result = await query(
    'SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

// READ - Get category by category_id
export async function getCategoryByCategoryId(categoryId: string): Promise<Category | null> {
  const result = await query(
    'SELECT * FROM categories WHERE category_id = $1 AND deleted_at IS NULL',
    [categoryId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

// READ - Get all categories with filtering and pagination
export async function getCategories(
  filters?: CategoryFilters,
  pagination?: PaginationOptions
): Promise<PaginatedResult<Category>> {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const sortBy = pagination?.sortBy || 'display_order';
  const sortOrder = pagination?.sortOrder || 'asc';
  const offset = (page - 1) * limit;

  // Build WHERE clause
  const conditions: string[] = ['deleted_at IS NULL'];
  const values: any[] = [];
  let paramCount = 1;

  if (filters?.is_active !== undefined) {
    conditions.push(`is_active = $${paramCount}`);
    values.push(filters.is_active);
    paramCount++;
  }

  if (filters?.search) {
    conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
    values.push(`%${filters.search}%`);
    paramCount++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as count FROM categories ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results
  const result = await query(
    `SELECT * FROM categories 
     ${whereClause}
     ORDER BY ${sortBy} ${sortOrder.toUpperCase()}, created_at ASC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    [...values, limit, offset]
  );

  const totalPages = Math.ceil(total / limit);

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

// READ - Get active categories (commonly used for public display)
export async function getActiveCategories(): Promise<Category[]> {
  const result = await query(
    `SELECT * FROM categories 
     WHERE is_active = true AND deleted_at IS NULL 
     ORDER BY display_order ASC, name ASC`
  );

  return result.rows;
}

// UPDATE - Update category
export async function updateCategory(id: string, updateData: UpdateCategoryData): Promise<Category> {
  const { category_id, name, description, image_url, display_order, is_active } = updateData;

  // Check if category exists
  const existingCategory = await getCategoryById(id);
  if (!existingCategory) {
    throw new Error('Category not found');
  }

  // Check if new category_id conflicts with existing one (if category_id is being updated)
  if (category_id && category_id !== existingCategory.category_id) {
    const conflictingCategory = await query(
      'SELECT id FROM categories WHERE category_id = $1 AND id != $2 AND deleted_at IS NULL',
      [category_id, id]
    );

    if (conflictingCategory.rows.length > 0) {
      throw new Error(`Category with ID '${category_id}' already exists`);
    }
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (category_id !== undefined) {
    updates.push(`category_id = $${paramCount}`);
    values.push(category_id);
    paramCount++;
  }

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }

  if (description !== undefined) {
    updates.push(`description = $${paramCount}`);
    values.push(description);
    paramCount++;
  }

  if (image_url !== undefined) {
    updates.push(`image_url = $${paramCount}`);
    values.push(image_url);
    paramCount++;
  }

  if (display_order !== undefined) {
    updates.push(`display_order = $${paramCount}`);
    values.push(display_order);
    paramCount++;
  }

  if (is_active !== undefined) {
    updates.push(`is_active = $${paramCount}`);
    values.push(is_active);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE categories 
     SET ${updates.join(', ')}
     WHERE id = $${paramCount} AND deleted_at IS NULL
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Category not found');
  }

  return result.rows[0];
}

// DELETE - Soft delete category
export async function deleteCategory(id: string): Promise<{ message: string }> {
  const result = await query(
    `UPDATE categories 
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  if (result.rowCount === 0) {
    throw new Error('Category not found');
  }

  return { message: 'Category deleted successfully' };
}

// DELETE - Hard delete category (use with caution)
export async function hardDeleteCategory(id: string): Promise<{ message: string }> {
  const result = await query(
    'DELETE FROM categories WHERE id = $1',
    [id]
  );

  if (result.rowCount === 0) {
    throw new Error('Category not found');
  }

  return { message: 'Category permanently deleted' };
}

// RESTORE - Restore soft-deleted category
export async function restoreCategory(id: string): Promise<Category> {
  const result = await query(
    `UPDATE categories 
     SET deleted_at = NULL, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NOT NULL
     RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Category not found or not deleted');
  }

  return result.rows[0];
}

// UTILITY - Toggle category active status
export async function toggleCategoryStatus(id: string): Promise<Category> {
  const result = await query(
    `UPDATE categories 
     SET is_active = NOT is_active, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Category not found');
  }

  return result.rows[0];
}

// UTILITY - Reorder categories
export async function reorderCategories(categoryOrders: Array<{ id: string; display_order: number }>): Promise<{ message: string }> {
  // Start transaction
  await query('BEGIN');

  try {
    for (const { id, display_order } of categoryOrders) {
      await query(
        `UPDATE categories 
         SET display_order = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL`,
        [display_order, id]
      );
    }

    await query('COMMIT');
    return { message: 'Categories reordered successfully' };
  } catch (error) {
    await query('ROLLBACK');
    throw new Error('Failed to reorder categories');
  }
}

// UTILITY - Get categories count by status
export async function getCategoriesStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  deleted: number;
}> {
  const result = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE deleted_at IS NULL) as total,
      COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_active = true) as active,
      COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_active = false) as inactive,
      COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted
    FROM categories
  `);

  const stats = result.rows[0];
  return {
    total: parseInt(stats.total),
    active: parseInt(stats.active),
    inactive: parseInt(stats.inactive),
    deleted: parseInt(stats.deleted)
  };
}