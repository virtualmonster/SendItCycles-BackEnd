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

export async function getProductsByCategory(req, res) {
  const { categoryId } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.id, p.category_id, p.name, p.description, p.price, p.stock_quantity, p.image_url, p.created_at, p.updated_at 
       FROM products p WHERE p.category_id = $1 ORDER BY p.name`,
      [categoryId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function getAllProducts(req, res) {
  try {
    console.log('Fetching all products...');
    const result = await pool.query(
      `SELECT p.id, p.category_id, p.name, p.description, p.price, p.stock_quantity, p.image_url, p.has_sizes, p.available_sizes, p.features, p.specs, p.geometry, p.created_at, p.updated_at, c.name as category_name 
       FROM products p 
       JOIN categories c ON p.category_id = c.id 
       ORDER BY p.created_at DESC`
    );
    console.log(`Found ${result.rows.length} products`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function getProductById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.id, p.category_id, p.name, p.description, p.price, p.stock_quantity, p.image_url, p.has_sizes, p.available_sizes, p.features, p.specs, p.geometry, p.created_at, p.updated_at, c.name as category_name 
       FROM products p 
       JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function createProduct(req, res) {
  const { category_id, name, description, price, stock_quantity, image_url, has_sizes, available_sizes, features, specs, geometry } = req.body;

  if (!category_id || !name || !price || stock_quantity === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Convert specs and geometry to JSON strings if they're objects
    const specsStr = typeof specs === 'string' ? specs : (specs ? JSON.stringify(specs) : '{}');
    const geometryStr = typeof geometry === 'string' ? geometry : (geometry ? JSON.stringify(geometry) : '{}');
    
    const result = await pool.query(
      `INSERT INTO products (category_id, name, description, price, stock_quantity, image_url, has_sizes, available_sizes, features, specs, geometry) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [category_id, name, description, price, stock_quantity, image_url, has_sizes ? 1 : 0, available_sizes || 'S,M,L,XL', features || '', specsStr, geometryStr]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, description, price, stock_quantity, image_url, category_id, has_sizes, available_sizes, features, specs, geometry } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (stock_quantity !== undefined) {
      updates.push(`stock_quantity = $${paramCount++}`);
      values.push(stock_quantity);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }
    if (has_sizes !== undefined) {
      updates.push(`has_sizes = $${paramCount++}`);
      values.push(has_sizes ? 1 : 0);
    }
    if (available_sizes !== undefined) {
      updates.push(`available_sizes = $${paramCount++}`);
      values.push(available_sizes);
    }
    if (features !== undefined) {
      updates.push(`features = $${paramCount++}`);
      values.push(features);
    }
    if (specs !== undefined) {
      updates.push(`specs = $${paramCount++}`);
      const specsStr = typeof specs === 'string' ? specs : (specs ? JSON.stringify(specs) : '{}');
      values.push(specsStr);
    }
    if (geometry !== undefined) {
      updates.push(`geometry = $${paramCount++}`);
      const geometryStr = typeof geometry === 'string' ? geometry : (geometry ? JSON.stringify(geometry) : '{}');
      values.push(geometryStr);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

/**
 * @swagger
 * /api/admin/products/bulk:
 *   post:
 *     summary: Create multiple products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [products]
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [category_id, name, price, stock_quantity]
 *                   properties:
 *                     category_id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                     stock_quantity:
 *                       type: integer
 *                     image_url:
 *                       type: string
 *                     has_sizes:
 *                       type: boolean
 *                     available_sizes:
 *                       type: string
 *                     features:
 *                       type: string
 *                     specs:
 *                       type: object
 *                     geometry:
 *                       type: object
 *     responses:
 *       201:
 *         description: Products created successfully
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
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 errors:
 *                   type: array
 */
export async function bulkCreateProducts(req, res) {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'products array is required and must not be empty' });
  }

  const results = [];
  const errors = [];

  try {
    for (let i = 0; i < products.length; i++) {
      const { category_id, name, description, price, stock_quantity, image_url, has_sizes, available_sizes, features, specs, geometry } = products[i];

      // Validate required fields
      if (!category_id || !name || price === undefined || stock_quantity === undefined) {
        errors.push({ 
          index: i, 
          error: 'Missing required fields: category_id, name, price, stock_quantity' 
        });
        continue;
      }

      try {
        const specsStr = typeof specs === 'string' ? specs : (specs ? JSON.stringify(specs) : '{}');
        const geometryStr = typeof geometry === 'string' ? geometry : (geometry ? JSON.stringify(geometry) : '{}');
        
        const result = await pool.query(
          `INSERT INTO products (category_id, name, description, price, stock_quantity, image_url, has_sizes, available_sizes, features, specs, geometry) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [category_id, name, description, price, stock_quantity, image_url, has_sizes ? 1 : 0, available_sizes || 'S,M,L,XL', features || '', specsStr, geometryStr]
        );
        results.push(result.rows[0]);
      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }

    res.status(201).json({
      success: errors.length === 0,
      created: results.length,
      failed: errors.length,
      products: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

/**
 * @swagger
 * /api/admin/products/bulk:
 *   put:
 *     summary: Update multiple products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [products]
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id]
 *                   properties:
 *                     id:
 *                       type: integer
 *                     category_id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                     stock_quantity:
 *                       type: integer
 *                     image_url:
 *                       type: string
 *                     has_sizes:
 *                       type: boolean
 *                     available_sizes:
 *                       type: string
 *                     features:
 *                       type: string
 *                     specs:
 *                       type: object
 *                     geometry:
 *                       type: object
 *     responses:
 *       200:
 *         description: Products updated successfully
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
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 errors:
 *                   type: array
 */
export async function bulkUpdateProducts(req, res) {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'products array is required and must not be empty' });
  }

  const results = [];
  const errors = [];

  try {
    for (let i = 0; i < products.length; i++) {
      const { id, category_id, name, description, price, stock_quantity, image_url, has_sizes, available_sizes, features, specs, geometry } = products[i];

      if (!id) {
        errors.push({ index: i, error: 'Product id is required' });
        continue;
      }

      try {
        let paramCount = 1;
        const updates = [];
        const values = [];

        if (category_id !== undefined) {
          updates.push(`category_id = $${paramCount++}`);
          values.push(category_id);
        }
        if (name !== undefined) {
          updates.push(`name = $${paramCount++}`);
          values.push(name);
        }
        if (description !== undefined) {
          updates.push(`description = $${paramCount++}`);
          values.push(description);
        }
        if (price !== undefined) {
          updates.push(`price = $${paramCount++}`);
          values.push(price);
        }
        if (stock_quantity !== undefined) {
          updates.push(`stock_quantity = $${paramCount++}`);
          values.push(stock_quantity);
        }
        if (image_url !== undefined) {
          updates.push(`image_url = $${paramCount++}`);
          values.push(image_url);
        }
        if (has_sizes !== undefined) {
          updates.push(`has_sizes = $${paramCount++}`);
          values.push(has_sizes ? 1 : 0);
        }
        if (available_sizes !== undefined) {
          updates.push(`available_sizes = $${paramCount++}`);
          values.push(available_sizes);
        }
        if (features !== undefined) {
          updates.push(`features = $${paramCount++}`);
          values.push(features);
        }
        if (specs !== undefined) {
          updates.push(`specs = $${paramCount++}`);
          const specsStr = typeof specs === 'string' ? specs : (specs ? JSON.stringify(specs) : '{}');
          values.push(specsStr);
        }
        if (geometry !== undefined) {
          updates.push(`geometry = $${paramCount++}`);
          const geometryStr = typeof geometry === 'string' ? geometry : (geometry ? JSON.stringify(geometry) : '{}');
          values.push(geometryStr);
        }

        if (updates.length === 0) {
          errors.push({ index: i, error: 'No fields to update' });
          continue;
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const query = `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
          errors.push({ index: i, error: `Product with id ${id} not found` });
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
      products: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}
