// routes/reviews.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateMiddleware } = require('./admin');

const router = express.Router();

// Configure multer for review image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/reviews';
    
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
    cb(null, 'review-' + uniqueSuffix + ext);
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

// GET /reviews - get all reviews
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM avis ORDER BY id DESC');
    res.json({ reviews: rows });
  } catch (err) {
    console.error('Get reviews error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /reviews - create new review
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { description, author } = req.body;
    
    if (!description || !author) {
      return res.status(400).json({ error: 'Description and author are required' });
    }

    // Check if image was uploaded
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/reviews/${req.file.filename}`;
    }

    const { rows } = await db.query(
      'INSERT INTO avis (description, author, image) VALUES ($1, $2, $3) RETURNING *',
      [description, author, imagePath]
    );

    res.status(201).json({ review: rows[0] });
  } catch (err) {
    console.error('Create review error', err);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
      });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /reviews/:id - delete review (admin only)
router.delete('/:id', authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get review to delete associated image
    const reviewResult = await db.query(
      'SELECT image FROM avis WHERE id = $1',
      [id]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const { rows } = await db.query('DELETE FROM avis WHERE id = $1 RETURNING *', [id]);

    // Delete associated image file if it exists
    const imagePath = reviewResult.rows[0].image;
    if (imagePath && imagePath.startsWith('/uploads/reviews/')) {
      const fullPath = `.${imagePath}`;
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) console.error('Error deleting image file:', err);
        });
      }
    }

    res.json({ message: 'Review deleted', review: rows[0] });
  } catch (err) {
    console.error('Delete review error', err);
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