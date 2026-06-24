const express = require('express');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateMiddleware } = require('./admin');

const router = express.Router();

// Configure multer for banner uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/banners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
    }
  }
});

// GET /api/banners/active - Get active banner (public route)
router.get('/active', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, desktop_image, mobile_image, created_at, updated_at FROM banners WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1'
    );
    
    if (rows.length === 0) {
      return res.json({
        banner: {
          desktop_image: '/api/default-banner.jpg',
          mobile_image: '/api/default-banner-mobile.jpg'
        }
      });
    }
    
    res.json({ banner: rows[0] });
  } catch (err) {
    console.error('Error fetching active banner:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/banners - Get all banners (admin only)
router.get('/', authenticateMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, desktop_image, mobile_image, is_active, created_at, updated_at FROM banners ORDER BY created_at DESC'
    );
    
    res.json({ banners: rows });
  } catch (err) {
    console.error('Error fetching banners:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/banners - Create new banner (admin only)
router.post('/', authenticateMiddleware, upload.fields([
  { name: 'desktop_image', maxCount: 1 },
  { name: 'mobile_image', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.desktop_image || !req.files.mobile_image) {
      return res.status(400).json({ error: 'Both desktop and mobile banner images are required' });
    }

    const desktopImagePath = '/uploads/banners/' + req.files.desktop_image[0].filename;
    const mobileImagePath = '/uploads/banners/' + req.files.mobile_image[0].filename;
    
    // Deactivate all existing banners
    await db.query('UPDATE banners SET is_active = FALSE');
    
    // Insert new active banner
    const { rows } = await db.query(
      'INSERT INTO banners (desktop_image, mobile_image, is_active) VALUES ($1, $2, TRUE) RETURNING *',
      [desktopImagePath, mobileImagePath]
    );
    
    res.json({ message: 'Banner created successfully', banner: rows[0] });
  } catch (err) {
    console.error('Error creating banner:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/banners/:id/activate - Set a banner as active (admin only)
router.put('/:id/activate', authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Deactivate all banners
    await db.query('UPDATE banners SET is_active = FALSE');
    
    // Activate the selected banner
    const { rows } = await db.query(
      'UPDATE banners SET is_active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    res.json({ message: 'Banner activated successfully', banner: rows[0] });
  } catch (err) {
    console.error('Error activating banner:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/banners/:id - Delete a banner (admin only)
router.delete('/:id', authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get banner info before deleting
    const { rows } = await db.query('SELECT desktop_image, mobile_image, is_active FROM banners WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    const banner = rows[0];
    
    // Don't allow deleting the active banner if it's the only one
    if (banner.is_active) {
      const { rows: allBanners } = await db.query('SELECT COUNT(*) as count FROM banners');
      if (parseInt(allBanners[0].count) === 1) {
        return res.status(400).json({ error: 'Cannot delete the only active banner' });
      }
    }
    
    // Delete from database
    await db.query('DELETE FROM banners WHERE id = $1', [id]);
    
    // Delete files from filesystem
    const deleteFile = (filePath) => {
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    };
    
    deleteFile(banner.desktop_image);
    deleteFile(banner.mobile_image);
    
    // If deleted banner was active, activate the most recent one
    if (banner.is_active) {
      await db.query(
        'UPDATE banners SET is_active = TRUE WHERE id = (SELECT id FROM banners ORDER BY created_at DESC LIMIT 1)'
      );
    }
    
    res.json({ message: 'Banner deleted successfully' });
  } catch (err) {
    console.error('Error deleting banner:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
