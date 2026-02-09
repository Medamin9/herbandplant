const express = require('express');
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const COOKIE_NAME = 'token';
const SALT_ROUNDS = 12;

if (!JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Set process.env.JWT_SECRET for production use.');
}

// helper: sign token
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Middleware: authenticate from cookie or Authorization header
function authenticateMiddleware(req, res, next) {
  const token = (req.cookies && req.cookies[COOKIE_NAME]) || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.admin = decoded; // decoded should contain at least { id, email }
    next();
  });
}

// POST /admin/login
// body: { email, password }
// sets httpOnly cookie on success
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const { rows } = await db.query('SELECT id, email, password_hash FROM admins WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: admin.id, email: admin.email });

    // set httpOnly cookie (secure flag if in production over https)
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days in ms (cookie lifetime) - JWT will still control validity
    };
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true; // send only over HTTPS
    }

    res.cookie(COOKIE_NAME, token, cookieOptions);
    res.json({ message: 'Logged in', admin: { id: admin.id, email: admin.email } });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/logout
// clears the cookie
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ message: 'Logged out' });
});

// GET /admin/me
router.get('/me', authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.admin;
    const { rows } = await db.query('SELECT id, email, created_at FROM admins WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Admin not found' });
    res.json({ admin: rows[0] });
  } catch (err) {
    console.error('/me error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /admin (update credentials)
// body: { currentPassword, email?, password? }
// must provide currentPassword for verification
router.put('/', authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.admin;
    const { currentPassword, email: newEmail, password: newPassword } = req.body;

    if (!currentPassword) return res.status(400).json({ error: 'currentPassword is required to update credentials' });
    if (!newEmail && !newPassword) return res.status(400).json({ error: 'Provide at least email or password to update' });

    const { rows } = await db.query('SELECT id, password_hash, email FROM admins WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Admin not found' });

    const admin = rows[0];
    const verified = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!verified) return res.status(401).json({ error: 'Current password incorrect' });

    // build update dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (newEmail) {
      updates.push(`email = $${paramIndex++}`);
      params.push(newEmail);
    }
    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      updates.push(`password_hash = $${paramIndex++}`);
      params.push(hash);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    // add id param
    params.push(id);
    const sql = `UPDATE admins SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, created_at`;
    const result = await db.query(sql, params);

    // if email changed, sign a new token with the updated email
    let newToken;
    if (newEmail) {
      newToken = signToken({ id: result.rows[0].id, email: result.rows[0].email });
      const cookieOptions = {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      };
      if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
      res.cookie('token', newToken, cookieOptions);
    }

    res.json({ message: 'Credentials updated', admin: result.rows[0] });
  } catch (err) {
    // detect unique violation on email
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error('Update credentials error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { router, authenticateMiddleware };