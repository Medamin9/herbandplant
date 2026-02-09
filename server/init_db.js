// init_db.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db');

const SALT_ROUNDS = 12;

async function init() {
  try {
    // admins table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS AVIS (
            id SERIAL PRIMARY KEY,
            description TEXT NOT NULL,
            author TEXT NOT NULL,
            image TEXT
        );
    `);
    
    // categories table
    await db.query(`
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            image TEXT
        );
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            price NUMERIC(10,2) NOT NULL,
            volumes TEXT[],
            description TEXT,
            long_description TEXT,
            composition TEXT,
            usage TEXT,
            banner TEXT,
            images TEXT[],
            promotion NUMERIC(10,2) DEFAULT 0,
            new_product BOOLEAN DEFAULT FALSE,
            top_vente BOOLEAN DEFAULT FALSE,
            stock_repture BOOLEAN DEFAULT FALSE,
            category_id INT REFERENCES categories(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            order_number TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_address TEXT NOT NULL,
            customer_city TEXT NOT NULL,
            customer_zip_code TEXT NOT NULL,
            customer_country TEXT NOT NULL DEFAULT 'Tunisia',
            order_notes TEXT,
            subtotal NUMERIC(10,2) NOT NULL,
            shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
            total NUMERIC(10,2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    
    await db.query(`
        CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INT REFERENCES orders(id) ON DELETE CASCADE,
            product_id INT REFERENCES products(id) ON DELETE SET NULL,
            product_name TEXT NOT NULL,
            product_price NUMERIC(10,2) NOT NULL,
            volume TEXT NOT NULL,
            quantity INT NOT NULL,
            total_price NUMERIC(10,2) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);  

    // initial admin setup
    const initEmail = process.env.INITIAL_ADMIN_EMAIL;
    const initPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (initEmail && initPassword) {
      const { rows } = await db.query('SELECT id FROM admins WHERE email = $1', [initEmail]);
      if (rows.length === 0) {
        const hash = await bcrypt.hash(initPassword, SALT_ROUNDS);
        await db.query('INSERT INTO admins (email, password_hash) VALUES ($1, $2)', [initEmail, hash]);
        console.log(`Created initial admin: ${initEmail}`);
      } else {
        console.log(`Admin ${initEmail} already exists — skipping creation.`);
      }
    } else {
      console.log('INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set — skipping initial admin creation.');
    }

    console.log('DB initialization complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

init();
