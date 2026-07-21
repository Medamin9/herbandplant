// routes/categories.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateMiddleware } = require('./admin');

const router = express.Router();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/categories';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'category-' + uniqueSuffix + ext);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET /categories - get all categories
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.*, 
        COUNT(DISTINCT s.id) as subcategories_count,
        COUNT(DISTINCT p.id) as products_count
      FROM categories c
      LEFT JOIN subcategories s ON c.id = s.category_id
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name
    `);
    res.json({ categories: rows });
  } catch (err) {
    console.error('Get categories error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /categories/:id - get single category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM categories WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category: rows[0] });
  } catch (err) {
    console.error('Get category error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /categories - create new category (admin only)
router.post('/', authenticateMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    
    // Check if image was uploaded
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/categories/${req.file.filename}`;
    }

    const { rows } = await db.query(
      'INSERT INTO categories (name, image) VALUES ($1, $2) RETURNING *',
      [name, imagePath]
    );

    res.status(201).json({ category: rows[0] });
  } catch (err) {
    console.error('Create category error', err);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
      });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /categories/:id - update category (admin only)
router.put('/:id', authenticateMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Get current category to check for existing image
    const currentCategory = await db.query(
      'SELECT image FROM categories WHERE id = $1',
      [id]
    );

    if (currentCategory.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    let imagePath = currentCategory.rows[0].image;
    
    // If new image uploaded, update the image path and delete old image
    if (req.file) {
      const newImagePath = `/uploads/categories/${req.file.filename}`;
      
      // Delete old image file if it exists
      if (imagePath && imagePath.startsWith('/uploads/categories/')) {
        const oldImagePath = `.${imagePath}`;
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Error deleting old image:', err);
          });
        }
      }
      
      imagePath = newImagePath;
    }

    const { rows } = await db.query(
      'UPDATE categories SET name = $1, image = $2 WHERE id = $3 RETURNING *',
      [name, imagePath, id]
    );

    res.json({ category: rows[0] });
  } catch (err) {
    console.error('Update category error', err);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
      });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /categories/:id - delete category (admin only)
router.delete('/:id', authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has products
    const productCheck = await db.query(
      'SELECT id FROM products WHERE category_id = $1 LIMIT 1',
      [id]
    );
    
    if (productCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with associated products' 
      });
    }

    // Get category to delete associated image
    const categoryResult = await db.query(
      'SELECT image FROM categories WHERE id = $1',
      [id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { rows } = await db.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );

    // Delete associated image file if it exists
    const imagePath = categoryResult.rows[0].image;
    if (imagePath && imagePath.startsWith('/uploads/categories/')) {
      const fullPath = `.${imagePath}`;
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) console.error('Error deleting image file:', err);
        });
      }
    }

    res.json({ message: 'Category deleted', category: rows[0] });
  } catch (err) {
    console.error('Delete category error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling middleware for Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

module.exports = router;