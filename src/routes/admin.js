import pool from '../models/db.js';

export async function getCategories(req, res) {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function createCategory(req, res) {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const result = await pool.query(
      'UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function deleteCategory(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted', category: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

/**
 * @swagger
 * /api/admin/categories/bulk:
 *   post:
 *     summary: Create multiple categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categories]
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name]
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       201:
 *         description: Categories created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 created:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 errors:
 *                   type: array
 */
export async function bulkCreateCategories(req, res) {
  const { categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: 'categories array is required and must not be empty' });
  }

  const results = [];
  const errors = [];

  try {
    for (let i = 0; i < categories.length; i++) {
      const { name, description } = categories[i];

      if (!name) {
        errors.push({ index: i, error: 'Category name is required' });
        continue;
      }

      try {
        const result = await pool.query(
          'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
          [name, description || '']
        );
        results.push(result.rows[0]);
      } catch (err) {
        if (err.code === '23505') {
          errors.push({ index: i, error: `Category "${name}" already exists` });
        } else {
          errors.push({ index: i, error: err.message });
        }
      }
    }

    res.status(201).json({
      success: errors.length === 0,
      created: results.length,
      failed: errors.length,
      categories: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

/**
 * @swagger
 * /api/admin/categories/bulk:
 *   put:
 *     summary: Update multiple categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categories]
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id]
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Categories updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 updated:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 errors:
 *                   type: array
 */
export async function bulkUpdateCategories(req, res) {
  const { categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: 'categories array is required and must not be empty' });
  }

  const results = [];
  const errors = [];

  try {
    for (let i = 0; i < categories.length; i++) {
      const { id, name, description } = categories[i];

      if (!id) {
        errors.push({ index: i, error: 'Category id is required' });
        continue;
      }

      try {
        const result = await pool.query(
          'UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
          [name, description, id]
        );

        if (result.rows.length === 0) {
          errors.push({ index: i, error: `Category with id ${id} not found` });
        } else {
          results.push(result.rows[0]);
        }
      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }

    res.json({
      success: errors.length === 0,
      updated: results.length,
      failed: errors.length,
      categories: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}
