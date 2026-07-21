// routes/subcategories.js
const express = require('express');
const db = require('../db');
const { authenticateMiddleware } = require('./admin');

const router = express.Router();

// GET /subcategories - get all subcategories (optionally filter by category_id)
router.get('/', async (req, res) => {
  try {
    const { category_id } = req.query;
    
    let query = `
      SELECT s.*, c.name as category_name 
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
    `;
    const params = [];
    
    if (category_id) {
      query += ' WHERE s.category_id = $1';
      params.push(category_id);
    }
    
    query += ' ORDER BY s.name';
    
    const { rows } = await db.query(query, params);
    res.json({ subcategories: rows });
  } catch (err) {
    console.error('Get subcategories error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /subcategories/:id - get single subcategory
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT s.*, c.name as category_name FROM subcategories s LEFT JOIN categories c ON s.category_id = c.id WHERE s.id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    res.json({ subcategory: rows[0] });
  } catch (err) {
    console.error('Get subcategory error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /subcategories - create new subcategory (admin only)
router.post('/', authenticateMiddleware, async (req, res) => {
  try {
    const { name, category_id } = req.body;
    
    if (!name || !category_id) {
      return res.status(400).json({ error: 'Name and category_id are required' });
    }

    const { rows } = await db.query(
      'INSERT INTO subcategories (name, category_id) VALUES ($1, $2) RETURNING *',
      [name, category_id]
    );

    res.status(201).json({ subcategory: rows[0] });
  } catch (err) {
    console.error('Create subcategory error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /subcategories/:id - update subcategory (admin only)
router.put('/:id', authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({ error: 'Name and category_id are required' });
    }

    const { rows } = await db.query(
      'UPDATE subcategories SET name = $1, category_id = $2 WHERE id = $3 RETURNING *',
      [name, category_id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    res.json({ subcategory: rows[0] });
  } catch (err) {
    console.error('Update subcategory error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /subcategories/:id - delete subcategory (admin only)
router.delete('/:id', authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if subcategory has products
    const productCheck = await db.query(
      'SELECT id FROM products WHERE subcategory_id = $1 LIMIT 1',
      [id]
    );
    
    if (productCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete subcategory with associated products' 
      });
    }

    const { rows } = await db.query(
      'DELETE FROM subcategories WHERE id = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    res.json({ message: 'Subcategory deleted', subcategory: rows[0] });
  } catch (err) {
    console.error('Delete subcategory error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
