// routes/products.js
const express = require('express');
const db = require('../db');
const { authenticateMiddleware } = require('./admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create directories if they don't exist
    const productsDir = 'uploads/products/';
    if (!fs.existsSync(productsDir)) {
      fs.mkdirSync(productsDir, { recursive: true });
    }
    
    if (file.fieldname === 'banner') {
      cb(null, productsDir);
    } else if (file.fieldname === 'images') {
      cb(null, productsDir);
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
  }
});

// Custom middleware to handle multiple files with limits
const uploadFields = upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// GET /products - get all products with optional filtering
router.get('/', async (req, res) => {
  try {
    const {
      category_id,
      subcategory_id,
      min_price,
      max_price,
      promotion,
      new_product,
      top_vente,
      search,
      page = 1,
      limit = 12
    } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, s.name as subcategory_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category_id) {
      query += ` AND p.category_id = $${paramIndex++}`;
      params.push(parseInt(category_id));
    }

    if (subcategory_id) {
      query += ` AND p.subcategory_id = $${paramIndex++}`;
      params.push(parseInt(subcategory_id));
    }

    if (min_price) {
      query += ` AND p.price >= $${paramIndex++}`;
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      query += ` AND p.price <= $${paramIndex++}`;
      params.push(parseFloat(max_price));
    }

    if (promotion === 'true') {
      query += ` AND p.promotion > 0`;
    }

    if (new_product === 'true') {
      query += ` AND p.new_product = true`;
    }

    if (top_vente === 'true') {
      query += ` AND p.top_vente = true`;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total products for pagination
    const countQuery = query.replace(
      'SELECT p.*, c.name as category_name, s.name as subcategory_name',
      'SELECT COUNT(*) as total'
    );
    const countResult = await db.query(countQuery, params);
    const totalProducts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalProducts / limit);

    // Custom ordering logic
    query += `
      ORDER BY 
        CASE 
          WHEN p.promotion > 0 THEN 1
          WHEN p.new_product = true THEN 2
          WHEN p.stock_repture = true THEN 4
          ELSE 3
        END,
        p.created_at DESC
    `;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    
    res.json({ 
      products: rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_products: totalProducts,
        per_page: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Get products error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get 3 products different than the current one
router.get('/recommendations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id != $1
      ORDER BY 
        CASE WHEN p.top_vente = true THEN 1 ELSE 2 END,
        RANDOM()
      LIMIT 3;
    `;
  
    const { rows } = await db.query(query, [id]);
    res.json({ products: rows });
  } catch (err) {
    console.error('Get recommendations error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /products/home/data - get home page data (new products, promotions, top sellers, and random products)
router.get('/home/data', async (req, res) => {
  try {
    // Get latest new product (for banner/discover section)
    const newProductQuery = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.new_product = true 
      ORDER BY p.created_at DESC 
      LIMIT 1
    `;
    const newProductResult = await db.query(newProductQuery);
    const newProduct = newProductResult.rows.length > 0 ? formatProductNumbers(newProductResult.rows[0]) : null;

    // Get latest promoted product (for banner/discover section)
    const promotedProductQuery = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.promotion > 0 
      ORDER BY p.created_at DESC 
      LIMIT 1
    `;
    const promotedProductResult = await db.query(promotedProductQuery);
    const promotedProduct = promotedProductResult.rows.length > 0 ? formatProductNumbers(promotedProductResult.rows[0]) : null;

    // Get latest top seller product (for banner/discover section)
    const topSellerProductQuery = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.top_vente = true 
      ORDER BY p.created_at DESC 
      LIMIT 1
    `;
    const topSellerProductResult = await db.query(topSellerProductQuery);
    const topSellerProduct = topSellerProductResult.rows.length > 0 ? formatProductNumbers(topSellerProductResult.rows[0]) : null;

    // Get 4 latest new products
    const newProductsQuery = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.new_product = true 
      ORDER BY p.created_at DESC 
      LIMIT 4
    `;
    const newProductsResult = await db.query(newProductsQuery);
    const newProducts = newProductsResult.rows.map(formatProductNumbers);

    // Get 3 top selling products
    const topSellingProductsQuery = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.top_vente = true 
      ORDER BY p.created_at DESC 
      LIMIT 3
    `;
    const topSellingProductsResult = await db.query(topSellingProductsQuery);
    const topSellingProducts = topSellingProductsResult.rows.map(formatProductNumbers);

    res.json({
      newProduct,
      promotedProduct,
      topSellerProduct,
      newProducts,
      topSellingProducts
    });
  } catch (err) {
    console.error('Get home data error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to convert string numbers to actual numbers
function formatProductNumbers(product) {
  return {
    ...product,
    price: parseFloat(product.price),
    promotion: parseFloat(product.promotion || 0)
  };
}

// GET /products/:id - get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT p.*, c.name as category_name, s.name as subcategory_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE p.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: rows[0] });
  } catch (err) {
    console.error('Get product error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /products - create new product (admin only)
router.post('/', authenticateMiddleware, uploadFields, async (req, res) => {
  try {
    const {
      name,
      price,
      volumes,
      description,
      long_description,
      composition,
      usage,
      promotion,
      new_product,
      top_vente,
      stock_repture,
      category_id,
      subcategory_id
    } = req.body;

    // Process uploaded files
    let bannerPath = null;
    let imagesPaths = [];

    if (req.files && req.files['banner']) {
      bannerPath = `/uploads/products/${req.files['banner'][0].filename}`;
    }

    if (req.files && req.files['images']) {
      imagesPaths = req.files['images'].map(file => `/uploads/products/${file.filename}`);
    }

    // Convert arrays to PostgreSQL arrays
    let volumesArray = [];

    if (volumes) {
      try {
        // Try to parse as JSON first
        volumesArray = JSON.parse(volumes);
      } catch (e) {
        // If not valid JSON, treat as comma-separated string
        volumesArray = typeof volumes === 'string' 
          ? volumes.split(',').map(item => item.trim()).filter(item => item)
          : [];
      }
    }

    const { rows } = await db.query(`
      INSERT INTO products 
      (name, price, volumes, description, long_description, composition, usage, banner, images, promotion, new_product, top_vente, stock_repture, category_id, subcategory_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      name, 
      parseFloat(price), 
      volumesArray, 
      description, 
      long_description, 
      composition, 
      usage,
      bannerPath, 
      imagesPaths, 
      parseFloat(promotion || 0), 
      new_product === 'true', 
      top_vente === 'true', 
      stock_repture === 'true',
      category_id || null,
      subcategory_id || null
    ]);

    res.status(201).json({ product: rows[0] });
  } catch (err) {
    console.error('Create product error', err);
    
    // Clean up uploaded files if there was an error
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
        });
      });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /products/:id - update product (admin only)
router.put('/:id', authenticateMiddleware, uploadFields, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      volumes,
      description,
      long_description,
      composition,
      usage,
      promotion,
      new_product,
      top_vente,
      stock_repture,
      category_id,
      subcategory_id
    } = req.body;

    // Get current product to check for existing files
    const currentProduct = await db.query(
      'SELECT banner, images FROM products WHERE id = $1',
      [id]
    );

    if (currentProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let bannerPath = currentProduct.rows[0].banner;
    let imagesPaths = currentProduct.rows[0].images || [];

    if (req.files && req.files['banner']) {
      if (bannerPath) {
        const oldBannerPath = `.${bannerPath}`;
        if (fs.existsSync(oldBannerPath)) {
          fs.unlink(oldBannerPath, (err) => {
            if (err) console.error('Error deleting old banner:', err);
          });
        }
      }
      bannerPath = `/uploads/products/${req.files['banner'][0].filename}`;
    }

    if (req.files && req.files['images']) {
      if (imagesPaths && imagesPaths.length > 0) {
        imagesPaths.forEach(oldImagePath => {
          const fullPath = `.${oldImagePath}`;
          if (fs.existsSync(fullPath)) {
            fs.unlink(fullPath, (err) => {
              if (err) console.error('Error deleting old image:', err);
            });
          }
        });
      }
      imagesPaths = req.files['images'].map(file => `/uploads/products/${file.filename}`);
    }

    let volumesArray = [];

    if (volumes) {
      try {
        volumesArray = JSON.parse(volumes);
      } catch (e) {
        volumesArray = typeof volumes === 'string' 
          ? volumes.split(',').map(item => item.trim()).filter(item => item)
          : [];
      }
    }

    const { rows } = await db.query(`
      UPDATE products 
      SET name = $1, price = $2, volumes = $3, description = $4, banner = $5, 
      images = $6, promotion = $7, new_product = $8, top_vente = $9, stock_repture = $10, 
      category_id = $11, long_description = $12, composition = $13, usage = $14, subcategory_id = $15
      WHERE id = $16
      RETURNING *
    `, [
      name, 
      parseFloat(price), 
      volumesArray, 
      description, 
      bannerPath, 
      imagesPaths, 
      parseFloat(promotion || 0), 
      new_product === 'true', 
      top_vente === 'true', 
      stock_repture === 'true', 
      category_id || null, 
      long_description, 
      composition, 
      usage,
      subcategory_id || null,
      id
    ]);

    res.json({ product: rows[0] });
  } catch (err) {
    console.error('Update product error', err);
    
    // Clean up uploaded files if there was an error
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
        });
      });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /products/:id - delete product (admin only)
router.delete('/:id', authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product to delete associated files
    const productResult = await db.query(
      'SELECT banner, images FROM products WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { rows } = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );

    // Delete associated files
    const product = productResult.rows[0];
    
    // Delete banner
    if (product.banner) {
      const bannerPath = `.${product.banner}`;
      if (fs.existsSync(bannerPath)) {
        fs.unlink(bannerPath, (err) => {
          if (err) console.error('Error deleting banner file:', err);
        });
      }
    }
    
    // Delete images
    if (product.images && product.images.length > 0) {
      product.images.forEach(imagePath => {
        const fullPath = `.${imagePath}`;
        if (fs.existsSync(fullPath)) {
          fs.unlink(fullPath, (err) => {
            if (err) console.error('Error deleting image file:', err);
          });
        }
      });
    }

    res.json({ message: 'Product deleted', product: rows[0] });
  } catch (err) {
    console.error('Delete product error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling middleware for Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files uploaded. Maximum 3 images allowed' });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

module.exports = router;
