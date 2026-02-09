// routes/orders.js
const express = require('express');
const db = require('../db');
const { authenticateMiddleware } = require('./admin');

const router = express.Router();

// GET /orders - get all orders (admin only)
router.get('/', authenticateMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'product_price', oi.product_price,
                 'quantity', oi.quantity,
                 'total_price', oi.total_price,
                 'volume', oi.volume
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    
    const params = [];
    
    if (status) {
      query += ` WHERE o.status = $1`;
      params.push(status);
    }
    
    query += ` GROUP BY o.id ORDER BY o.created_at DESC`;
    
    const { rows } = await db.query(query, params);
    res.json({ orders: rows });
  } catch (err) {
    console.error('Get orders error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /orders/:id - get single order
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderQuery = `
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'product_price', oi.product_price,
                 'quantity', oi.quantity,
                 'total_price', oi.total_price,
                 'volume', oi.volume
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    
    const { rows } = await db.query(orderQuery, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: rows[0] });
  } catch (err) {
    console.error('Get order error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /orders - create new order
// POST /orders - create new order
router.post('/', async (req, res) => {
  const client = await db.pool.connect(); // ✅ fixed
  
  try {
    await client.query('BEGIN');
    
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      customer_city = '',
      customer_zip_code = '',
      customer_country = 'Tunisia',
      order_notes = '',
      subtotal,
      shipping_cost = 8,
      total,
      payment_method = 'cash_on_delivery',
      items
    } = req.body;

    const orderNumber = 'ORD' + Date.now();

    const orderQuery = `
      INSERT INTO orders 
      (order_number, customer_name, customer_email, customer_phone, 
       customer_address, customer_city, customer_zip_code, customer_country,
       order_notes, subtotal, shipping_cost, total, payment_method)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const orderParams = [
      orderNumber, customer_name, customer_email, customer_phone,
      customer_address, customer_city, customer_zip_code, customer_country,
      order_notes, subtotal, shipping_cost, total, payment_method
    ];
    
    const orderResult = await client.query(orderQuery, orderParams);
    const order = orderResult.rows[0];

    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items 
        (order_id, product_id, product_name, product_price, quantity, total_price, volume)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await client.query(itemQuery, [
        order.id, 
        item.product_id, 
        item.product_name, 
        item.product_price, 
        item.quantity, 
        item.total_price,
        item.volume || '',
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json({ order });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create order error', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /orders/:id/status - update order status (admin only)
router.put('/:id/status', authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { rows } = await db.query(`
      UPDATE orders 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `, [status, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: rows[0] });
  } catch (err) {
    console.error('Update order status error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;