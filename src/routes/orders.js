import pool from '../models/db.js';

export async function createOrder(req, res) {
  const { items } = req.body;
  const user_id = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  try {
    await pool.query('BEGIN');

    let totalPrice = 0;
    for (const item of items) {
      const product = await pool.query('SELECT price, stock_quantity FROM products WHERE id = $1', [
        item.product_id,
      ]);

      if (product.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ error: `Product ${item.product_id} not found` });
      }

      if (product.rows[0].stock_quantity < item.quantity) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for product ${item.product_id}` });
      }

      totalPrice += product.rows[0].price * item.quantity;
    }

    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, total_price, status) 
       VALUES ($1, $2, $3) RETURNING *`,
      [user_id, totalPrice, 'pending']
    );

    const order_id = orderResult.rows[0].id;

    for (const item of items) {
      const product = await pool.query(
        'SELECT price FROM products WHERE id = $1',
        [item.product_id]
      );
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) 
         VALUES ($1, $2, $3, $4)`,
        [order_id, item.product_id, item.quantity, product.rows[0].price]
      );

      // Update stock
      await pool.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [
        item.quantity,
        item.product_id,
      ]);
    }

    await pool.query('COMMIT');
    res.status(201).json(orderResult.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function getUserOrders(req, res) {
  const user_id = req.user.id;

  try {
    // Use simpler query compatible with both SQLite and PostgreSQL
    const ordersResult = await pool.query(
      `SELECT o.id, o.user_id, o.total_price, o.status, o.created_at, o.updated_at
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [user_id]
    );

    // Fetch items for each order
    const orders = [];
    for (const order of ordersResult.rows) {
      const itemsResult = await pool.query(
        `SELECT oi.product_id, oi.quantity, oi.price_at_purchase as price, p.name
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      orders.push({
        ...order,
        items: itemsResult.rows
      });
    }

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function getOrderById(req, res) {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT o.id, o.user_id, o.total_price, o.status, o.created_at, o.updated_at
       FROM orders o
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    // Fetch items
    const itemsResult = await pool.query(
      `SELECT oi.product_id, oi.quantity, oi.price_at_purchase as price, p.name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    );

    order.items = itemsResult.rows;
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

// Admin: Get all orders
export async function getAllOrders(req, res) {
  try {
    const result = await pool.query(
      `SELECT o.id, o.user_id, o.total_price, o.status, o.created_at, o.updated_at, 
              u.email, u.first_name, u.last_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`,
      []
    );

    // Fetch items for each order
    const orders = [];
    for (const order of result.rows) {
      const itemsResult = await pool.query(
        `SELECT oi.product_id, oi.quantity, oi.price_at_purchase as price, p.name
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      orders.push({
        ...order,
        items: itemsResult.rows
      });
    }

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}

// Admin: Update order status
export async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}
