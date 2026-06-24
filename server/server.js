// server.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { router: adminRoutes } = require('./routes/admin');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const bannerRoutes = require('./routes/banners');

const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  `http://localhost:3000`,
  `http://${process.env.DOMAIN_NAME}`,
  `https://${process.env.DOMAIN_NAME}`,
  `http://www.${process.env.DOMAIN_NAME}`,
  `https://www.${process.env.DOMAIN_NAME}`
];

// Log pour debugging
console.log('=== CORS Configuration ===');
console.log('DOMAIN_NAME:', process.env.DOMAIN_NAME);
console.log('Allowed Origins:', allowedOrigins);
console.log('========================');

// CORS - Accepter toutes les origines (TEMPORAIRE pour debugging)
app.use(cors({
  origin: true, // Accepte toutes les origines
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', adminRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/orders', orderRoutes);
app.use('/reviews', reviewRoutes);
app.use('/banners', bannerRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});