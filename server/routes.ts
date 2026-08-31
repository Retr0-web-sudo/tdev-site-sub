/**
 * All API Routes for TDEV Backend
 * Maps to the Lovable/Supabase schema on Neon
 */

import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { neon, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Cloudinary SDK will be used for file uploads in production
// Run: npm install cloudinary
// Then import { v2 as cloudinary } from 'cloudinary';

neonConfig.fetchConnectionCache = true;

const uuidv4 = randomUUID;
import {
  authenticate,
  requireAdmin,
  AuthRequest,
  cacheControl,
  contactLimiter,
  subscribeLimiter,
  authLimiter,
} from './middleware';
import {
  signupSchema,
  loginSchema,
  contactSchema,
  messageReplySchema,
  productSchema,
  categorySchema,
  orderSchema,
  orderStatusSchema,
  designRequestSchema,
  blogPostSchema,
  announcementSchema,
  discountCodeSchema,
  pageViewSchema,
  siteSettingSchema,
  subscribeSchema,
} from './validators';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) console.warn('⚠️  JWT_SECRET not set — auth will not work');

// Lazy SQL client — initialized when first route is hit (dotenv already loaded by then)
// neon only supports tagged templates or .query() — we use .query() for all calls
let _sql: ReturnType<typeof neon> | null = null;
async function sql<T = any>(query: string, params?: any[]): Promise<T[]> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    _sql = neon(url);
  }
  return (await _sql.query(query, params || [])) as T[];
}

const router = Router();

// ── Helper: generate JWT ──
function generateToken(userId: string, role: string = 'user'): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

// ── Helper: set httpOnly cookie ──
function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

// ── Helper: convert numeric DB fields (returned as strings by Neon) to numbers ──
const NUMERIC_FIELDS = ['price', 'compare_at_price', 'stock_quantity', 'weight', 'total', 'discount_percent', 'quoted_price'];
function fixNumericFields(row: any): any {
  if (!row) return row;
  const r = { ...row };
  for (const field of NUMERIC_FIELDS) {
    if (r[field] !== null && r[field] !== undefined) {
      r[field] = Number(r[field]);
    }
  }
  return r;
}

function fixNumericFieldsArray(rows: any[]): any[] {
  return rows.map(fixNumericFields);
}

// ══════════════════════════════════════════════
//  HEALTH CHECK
// ══════════════════════════════════════════════

router.get('/health', cacheControl(0), async (_req, res: Response) => {
  try {
    await sql('SELECT 1', []);
    res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ success: false, status: 'unhealthy', error: 'Database connection failed' });
  }
});

// ══════════════════════════════════════════════
//  AUTH ROUTES
// ══════════════════════════════════════════════

// POST /api/auth/signup
router.post('/auth/signup', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const data = signupSchema.parse(req.body);

    // Check if user exists
    const existing = await sql(
      `SELECT id FROM profiles WHERE email = $1 LIMIT 1`,
      [data.email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create auth user (stored in profiles for simplicity — no Supabase Auth)
    await sql(
      `INSERT INTO profiles (id, user_id, email, display_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())`,
      [uuidv4(), userId, data.email, data.displayName || data.email.split('@')[0]]
    );

    // Store password hash (extend profiles table concept)
    await sql(
      `INSERT INTO user_roles (id, user_id, role) VALUES ($1, $2, $3)`,
      [uuidv4(), userId, 'user']
    );

    // We store auth in a simple auth table
    await sql(
      `INSERT INTO site_settings (id, key, value) VALUES ($1, $2, $3)`,
      [uuidv4(), `auth_${userId}`, JSON.stringify({ password: hashedPassword })]
    );

    const token = generateToken(userId, 'user');
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      token,
      user: { id: userId, email: data.email, displayName: data.displayName, role: 'user' },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    logger.error('Signup error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/auth/login', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const users = await sql(
      `SELECT id, user_id, email, display_name, avatar_url FROM profiles WHERE email = $1 LIMIT 1`,
      [data.email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = users[0];

    // Get password from site_settings
    const authRecords = await sql(
      `SELECT value FROM site_settings WHERE key = $1 LIMIT 1`,
      [`auth_${user.user_id}`]
    );

    if (authRecords.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const { password: hashedPassword } = authRecords[0].value as any;
    const valid = await bcrypt.compare(data.password, hashedPassword);

    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Get user role
    const roles = await sql(
      `SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1`,
      [user.user_id]
    );
    const role = roles.length > 0 ? roles[0].role : 'user';

    const token = generateToken(user.user_id, role);
    setAuthCookie(res, token);

    return res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        role,
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    logger.error('Login error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/auth/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const users = await sql(
      `SELECT p.user_id, p.email, p.display_name, p.avatar_url, COALESCE(ur.role, 'user') as role 
       FROM profiles p 
       LEFT JOIN user_roles ur ON ur.user_id = p.user_id 
       WHERE p.user_id = $1 LIMIT 1`,
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = users[0];

    return res.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error('Auth me error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ success: true, message: 'Logged out' });
});

// POST /api/auth/reset-password
router.post('/auth/reset-password', async (_req, res: Response) => {
  // For now, just acknowledge the request (no email sending in MVP)
  // In production, this would send a password reset email
  return res.json({ success: true, message: 'Password reset request received' });
});

// PUT /api/auth/me — compat route for password + profile updates
router.put('/auth/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { password, displayName, avatarUrl } = req.body;

    // If password provided, update it (store in site_settings)
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const existing = await sql(
        `SELECT id FROM site_settings WHERE key = $1 LIMIT 1`,
        [`auth_${req.userId}`]
      );
      if (existing.length > 0) {
        await sql(
          `UPDATE site_settings SET value = $1, updated_at = now() WHERE key = $2`,
          [JSON.stringify({ password: hashedPassword }), `auth_${req.userId}`]
        );
      } else {
        await sql(
          `INSERT INTO site_settings (id, key, value, updated_at) VALUES ($1, $2, $3, now())`,
          [uuidv4(), `auth_${req.userId}`, JSON.stringify({ password: hashedPassword })]
        );
      }
    }

    // If displayName/avatarUrl provided, update profile
    if (displayName !== undefined || avatarUrl !== undefined) {
      await sql(
        `UPDATE profiles SET display_name = COALESCE($1, display_name), avatar_url = COALESCE($2, avatar_url), updated_at = now()
         WHERE user_id = $3`,
        [displayName || null, avatarUrl || null, req.userId]
      );
    }

    return res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    logger.error('PUT /auth/me error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/auth/profile
router.put('/auth/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, avatarUrl } = req.body;

    await sql(
      `UPDATE profiles SET display_name = COALESCE($1, display_name), avatar_url = COALESCE($2, avatar_url), updated_at = now()
       WHERE user_id = $3`,
      [displayName || null, avatarUrl || null, req.userId]
    );

    return res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    logger.error('Profile update error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════

// GET /api/products
router.get('/products', cacheControl(60), async (_req, res: Response) => {
  try {
    const rows = await sql(`SELECT * FROM products ORDER BY created_at DESC`);
    return res.json({ success: true, data: fixNumericFieldsArray(rows) });
  } catch (err) {
    logger.error('Products fetch error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/products/id/:id (admin – fetch by UUID)
router.get('/products/id/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    return res.json({ success: true, data: fixNumericFields(rows[0]) });
  } catch (err) {
    logger.error('Product fetch by id error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/products/:slug
router.get('/products/:slug', async (req, res: Response) => {
  try {
    const rows = await sql(`SELECT * FROM products WHERE slug = $1 LIMIT 1`, [req.params.slug]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    return res.json({ success: true, data: fixNumericFields(rows[0]) });
  } catch (err) {
    logger.error('Product fetch error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/products
router.post('/products', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = productSchema.parse(req.body);
    const id = uuidv4();

    await sql(
      `INSERT INTO products (id, name, slug, description, price, compare_at_price, category_id, images, sizes, colors, in_stock, featured, sku, stock_quantity, weight, material, brand, tags, status, published, is_visible, published_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, now(), now(), now())`,
      [
        id, data.name, data.slug, data.description || null,
        String(data.price), data.compareAtPrice ? String(data.compareAtPrice) : null,
        data.categoryId || null,
        JSON.stringify(data.images || []), JSON.stringify(data.sizes || []), JSON.stringify(data.colors || []),
        data.inStock ?? true, data.featured ?? false,
        data.sku || null, data.stockQuantity ?? 0,
        data.weight ? String(data.weight) : null, data.material || null, data.brand || null,
        JSON.stringify(data.tags || []), data.status || 'published',
        data.published ?? true, data.isVisible ?? true,
      ]
    );

    const product = await sql(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [id]);
    return res.status(201).json({ success: true, data: fixNumericFields(product[0]) });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    logger.error('Product create error', { error: err.message });
    const message = process.env.NODE_ENV === 'production' ? 'Failed to create product' : err.message;
    return res.status(500).json({ success: false, error: message });
  }
});

// PUT /api/products/:id
router.put('/products/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = productSchema.partial().parse(req.body);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (value !== undefined) {
        fields.push(`${dbKey} = $${idx++}`);
        values.push(Array.isArray(value) ? JSON.stringify(value) : value);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    fields.push(`updated_at = now()`);
    values.push(req.params.id);

    await sql(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );

    const updated = await sql(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [req.params.id]);
    return res.json({ success: true, data: fixNumericFields(updated[0]) });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    logger.error('Product update error', { error: err.message });
    const message = process.env.NODE_ENV === 'production' ? 'Failed to update product' : err.message;
    return res.status(500).json({ success: false, error: message });
  }
});

// DELETE /api/products/:id
router.delete('/products/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await sql(`DELETE FROM products WHERE id = $1`, [req.params.id]);
    return res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    logger.error('Product delete error', { error: err.message });
    const message = process.env.NODE_ENV === 'production' ? 'Failed to delete product' : err.message;
    return res.status(500).json({ success: false, error: message });
  }
});

// ══════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════

// GET /api/categories
router.get('/categories', cacheControl(300), async (_req, res: Response) => {
  try {
    const rows = await sql(`SELECT * FROM categories ORDER BY display_order ASC, name ASC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Categories fetch error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/categories
router.post('/categories', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = categorySchema.parse(req.body);
    const id = uuidv4();
    await sql(
      `INSERT INTO categories (id, name, slug, description, image_url, display_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
      [id, data.name, data.slug, data.description || null, data.imageUrl || null, data.displayOrder ?? 0]
    );
    const category = await sql(`SELECT * FROM categories WHERE id = $1 LIMIT 1`, [id]);
    return res.status(201).json({ success: true, data: category[0] });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    logger.error('Category create error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/categories/:id
router.put('/categories/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = categorySchema.partial().parse(req.body);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${idx++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    fields.push(`updated_at = now()`);
    values.push(req.params.id);

    await sql(`UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    const updated = await sql(`SELECT * FROM categories WHERE id = $1 LIMIT 1`, [req.params.id]);
    return res.json({ success: true, data: updated[0] });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/categories/:id
router.delete('/categories/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await sql(`DELETE FROM categories WHERE id = $1`, [req.params.id]);
    return res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  MESSAGES (Contact Form)
// ══════════════════════════════════════════════

// POST /api/contact
router.post('/contact', contactLimiter, async (req, res: Response) => {
  try {
    const data = contactSchema.parse(req.body);
    const id = uuidv4();

    await sql(
      `INSERT INTO messages (id, name, email, subject, message, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'unread', now(), now())`,
      [id, data.name, data.email, data.subject, data.message]
    );

    return res.status(201).json({ success: true, id });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    logger.error('Contact submit error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/messages (admin only)
router.get('/messages', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(`SELECT * FROM messages ORDER BY created_at DESC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/messages/:id/reply
router.put('/messages/:id/reply', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = messageReplySchema.parse(req.body);
    await sql(
      `UPDATE messages SET admin_reply = $1, replied_at = now(), status = 'replied', updated_at = now()
       WHERE id = $2`,
      [data.adminReply, req.params.id]
    );
    return res.json({ success: true, message: 'Reply sent' });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/messages/:id/status
router.put('/messages/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    await sql(`UPDATE messages SET status = $1, updated_at = now() WHERE id = $2`, [status, req.params.id]);
    return res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  CUSTOM DESIGN REQUESTS
// ══════════════════════════════════════════════

// POST /api/design-requests
router.post('/design-requests', async (req, res: Response) => {
  try {
    const data = designRequestSchema.parse(req.body);
    const id = uuidv4();

    await sql(
      `INSERT INTO custom_design_requests (id, name, email, phone, shirt_color, shirt_size, design_image_url, design_data, notes, quantity, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', now(), now())`,
      [
        id, data.name, data.email, data.phone || null,
        data.shirtColor || 'white', data.shirtSize || 'M',
        data.designImageUrl || null, JSON.stringify(data.designData || {}),
        data.notes || null, data.quantity ?? 1,
      ]
    );

    return res.status(201).json({ success: true, id });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    logger.error('Design request error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/design-requests (admin only)
router.get('/design-requests', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(`SELECT * FROM custom_design_requests ORDER BY created_at DESC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/design-requests/:id (admin)
router.put('/design-requests/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, adminNotes, quotedPrice } = req.body;
    await sql(
      `UPDATE custom_design_requests SET status = COALESCE($1, status), admin_notes = COALESCE($2, admin_notes), quoted_price = COALESCE($3, quoted_price), updated_at = now() WHERE id = $4`,
      [status || null, adminNotes || null, quotedPrice ? String(quotedPrice) : null, req.params.id]
    );
    return res.json({ success: true, message: 'Design request updated' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════

// GET /api/orders
router.get('/orders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let rows;
    if (req.userRole === 'admin') {
      rows = await sql(`SELECT * FROM orders ORDER BY created_at DESC`);
    } else {
      rows = await sql(`SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`, [req.userId]);
    }
    return res.json({ success: true, data: fixNumericFieldsArray(rows) });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/orders
router.post('/orders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = orderSchema.parse(req.body);
    const id = uuidv4();

    await sql(
      `INSERT INTO orders (id, user_id, status, total, shipping_address, items, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
      [
        id, req.userId, data.status || 'pending', String(data.total || 0),
        JSON.stringify(data.shippingAddress || {}), JSON.stringify(data.items || []),
      ]
    );

    const order = await sql(`SELECT * FROM orders WHERE id = $1 LIMIT 1`, [id]);
    return res.status(201).json({ success: true, data: fixNumericFields(order[0]) });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/orders/:id/status (admin)
router.put('/orders/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = orderStatusSchema.parse(req.body);
    await sql(`UPDATE orders SET status = $1, updated_at = now() WHERE id = $2`, [data.status, req.params.id]);
    return res.json({ success: true, message: 'Order status updated' });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  BLOG POSTS
// ══════════════════════════════════════════════

// GET /api/blog
router.get('/blog', cacheControl(120), async (req, res: Response) => {
  try {
    const publishedOnly = req.query.published !== 'false';
    let rows;
    if (publishedOnly) {
      rows = await sql(`SELECT * FROM blog_posts WHERE published = true ORDER BY created_at DESC`);
    } else {
      rows = await sql(`SELECT * FROM blog_posts ORDER BY created_at DESC`);
    }
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/blog/:slug
router.get('/blog/:slug', async (req, res: Response) => {
  try {
    const rows = await sql(`SELECT * FROM blog_posts WHERE slug = $1 LIMIT 1`, [req.params.slug]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/blog
router.post('/blog', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = blogPostSchema.parse(req.body);
    const id = uuidv4();

    await sql(
      `INSERT INTO blog_posts (id, title, slug, excerpt, content, cover_image, published, author_name, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())`,
      [
        id, data.title, data.slug, data.excerpt || null, data.content,
        data.coverImage || null, data.published ?? false,
        data.authorName || 'TDEV', JSON.stringify(data.tags || []),
      ]
    );

    const post = await sql(`SELECT * FROM blog_posts WHERE id = $1 LIMIT 1`, [id]);
    return res.status(201).json({ success: true, data: post[0] });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/blog/:id
router.put('/blog/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = blogPostSchema.partial().parse(req.body);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${idx++}`);
        values.push(Array.isArray(value) ? JSON.stringify(value) : value);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    fields.push(`updated_at = now()`);
    values.push(req.params.id);

    await sql(`UPDATE blog_posts SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    const updated = await sql(`SELECT * FROM blog_posts WHERE id = $1 LIMIT 1`, [req.params.id]);
    return res.json({ success: true, data: updated[0] });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/blog/:id
router.delete('/blog/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await sql(`DELETE FROM blog_posts WHERE id = $1`, [req.params.id]);
    return res.json({ success: true, message: 'Blog post deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  ANNOUNCEMENTS
// ══════════════════════════════════════════════

// GET /api/announcements
router.get('/announcements', cacheControl(60), async (_req, res: Response) => {
  try {
    const rows = await sql(`SELECT * FROM announcements WHERE active = true ORDER BY display_order ASC, created_at DESC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/announcements
router.post('/announcements', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = announcementSchema.parse(req.body);
    const id = uuidv4();
    await sql(
      `INSERT INTO announcements (id, title, message, link_text, link_url, active, display_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())`,
      [id, data.title, data.message, data.linkText || null, data.linkUrl || null, data.active ?? true, data.displayOrder ?? 0]
    );
    const ann = await sql(`SELECT * FROM announcements WHERE id = $1 LIMIT 1`, [id]);
    return res.status(201).json({ success: true, data: ann[0] });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/announcements/:id
router.put('/announcements/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, linkText, linkUrl, active, displayOrder } = req.body;
    await sql(
      `UPDATE announcements SET title = COALESCE($1, title), message = COALESCE($2, message), link_text = COALESCE($3, link_text), link_url = COALESCE($4, link_url), active = COALESCE($5, active), display_order = COALESCE($6, display_order), updated_at = now() WHERE id = $7`,
      [title || null, message || null, linkText || null, linkUrl || null, active !== undefined ? active : null, displayOrder !== undefined ? displayOrder : null, req.params.id]
    );
    return res.json({ success: true, message: 'Announcement updated' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/announcements/:id
router.delete('/announcements/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await sql(`DELETE FROM announcements WHERE id = $1`, [req.params.id]);
    return res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  DISCOUNT CODES
// ══════════════════════════════════════════════

// GET /api/discount-codes (admin)
router.get('/discount-codes', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(`SELECT * FROM discount_codes ORDER BY created_at DESC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/discount-codes (admin)
router.post('/discount-codes', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = discountCodeSchema.parse(req.body);
    const id = uuidv4();

    await sql(
      `INSERT INTO discount_codes (id, code, discount_percent, game_name, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [id, data.code.toUpperCase(), data.discountPercent, data.gameName, data.expiresAt ? new Date(data.expiresAt) : null]
    );

    const code = await sql(`SELECT * FROM discount_codes WHERE id = $1 LIMIT 1`, [id]);
    return res.status(201).json({ success: true, data: code[0] });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/discount-codes/validate
router.post('/discount-codes/validate', async (req, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Code is required' });
    }

    const rows = await sql(
      `SELECT * FROM discount_codes WHERE code = $1 AND used = false AND expires_at > now() LIMIT 1`,
      [code.toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invalid or expired discount code' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  PAGE VIEWS (Analytics)
// ══════════════════════════════════════════════

// POST /api/page-views
router.post('/page-views', async (req, res: Response) => {
  try {
    const data = pageViewSchema.parse(req.body);
    const id = uuidv4();
    await sql(
      `INSERT INTO page_views (id, page, visitor_id, session_duration, created_at) VALUES ($1, $2, $3, $4, now())`,
      [id, data.page, data.visitorId || null, data.sessionDuration ?? 0]
    );
    return res.status(201).json({ success: true, id });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/page-views/stats (admin)
router.get('/page-views/stats', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(`
      SELECT page, COUNT(*) as views, COUNT(DISTINCT visitor_id) as unique_visitors
      FROM page_views
      GROUP BY page
      ORDER BY views DESC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  SITE SETTINGS
// ══════════════════════════════════════════════

// GET /api/settings
router.get('/settings', cacheControl(60), async (_req, res: Response) => {
  try {
    const rows = await sql(`SELECT key, value, updated_at FROM site_settings`);
    const settings: Record<string, any> = {};
    for (const row of rows) {
      if (!(row.key as string).startsWith('auth_')) {
        settings[row.key as string] = row.value;
      }
    }
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/settings/:key
router.put('/settings/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { value } = req.body;
    const { key } = req.params;

    const existing = await sql(`SELECT id FROM site_settings WHERE key = $1 LIMIT 1`, [key]);
    if (existing.length > 0) {
      await sql(`UPDATE site_settings SET value = $1, updated_at = now() WHERE key = $2`, [JSON.stringify(value), key]);
    } else {
      await sql(`INSERT INTO site_settings (id, key, value, updated_at) VALUES ($1, $2, $3, now())`, [uuidv4(), key, JSON.stringify(value)]);
    }

    return res.json({ success: true, message: 'Setting saved' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  NEWSLETTER SUBSCRIPTION
// ══════════════════════════════════════════════

// POST /api/subscribe
router.post('/subscribe', subscribeLimiter, async (req, res: Response) => {
  try {
    const data = subscribeSchema.parse(req.body);

    // Store in messages with type 'subscription' — or use site_settings
    const existing = await sql(
      `SELECT id FROM site_settings WHERE key = $1 LIMIT 1`,
      [`subscriber_${data.email}`]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'This email is already subscribed' });
    }

    await sql(
      `INSERT INTO site_settings (id, key, value, updated_at) VALUES ($1, $2, $3, now())`,
      [uuidv4(), `subscriber_${data.email}`, JSON.stringify({ email: data.email, subscribedAt: new Date().toISOString() })]
    );

    return res.status(201).json({ success: true, message: 'Subscribed successfully' });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/subscribers (admin)
router.get('/subscribers', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(`SELECT value FROM site_settings WHERE key LIKE 'subscriber_%' ORDER BY updated_at DESC`);
    const subscribers = rows.map((r: any) => r.value);
    return res.json({ success: true, data: subscribers });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  PROFILES (admin)
// ══════════════════════════════════════════════

// GET /api/profiles (admin)
router.get('/profiles', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(`SELECT * FROM profiles ORDER BY created_at DESC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  USER ROLES (admin)
// ══════════════════════════════════════════════

// PUT /api/users/:userId/role (admin)
router.put('/users/:userId/role', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!['admin', 'editor', 'user'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const existing = await sql(`SELECT id FROM user_roles WHERE user_id = $1 LIMIT 1`, [req.params.userId]);
    if (existing.length > 0) {
      await sql(`UPDATE user_roles SET role = $1 WHERE user_id = $2`, [role, req.params.userId]);
    } else {
      await sql(`INSERT INTO user_roles (id, user_id, role) VALUES ($1, $2, $3)`, [uuidv4(), req.params.userId, role]);
    }

    return res.json({ success: true, message: 'Role updated' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════
//  FUNCTION PROXY ROUTES (stub / MVP)
// ══════════════════════════════════════════════

// POST /api/functions/detect-region
router.post('/functions/detect-region', async (_req, res: Response) => {
  return res.json({ data: { country: 'US', currency: 'USD', locale: 'en-US' }, error: null });
});

// POST /api/functions/game-coupon
router.post('/functions/game-coupon', async (req, res: Response) => {
  const { action } = req.body || {};
  if (action === 'claim') {
    return res.json({ data: { success: true, code: 'GAME-123', discountPercent: 10 }, error: null });
  }
  if (action === 'validate') {
    return res.json({ data: { valid: true, discountPercent: 10 }, error: null });
  }
  return res.json({ data: null, error: new Error('Unknown action') });
});

// ══════════════════════════════════════════════
//  FILE UPLOAD (multi-provider: Cloudinary, AWS S3, DigitalOcean Spaces, local)
// ══════════════════════════════════════════════

// GET /api/storage/config — returns active storage configuration (for admin panel)
router.get('/storage/config', async (_req, res) => {
  try {
    const settings = await sql('SELECT value FROM site_settings WHERE key = $1', ['storage_config']);
    return res.json({ success: true, data: settings.length ? settings[0].value : null });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to get storage config' });
  }
});

// POST /api/upload — accepts base64 or URL, uploads to active storage provider
router.post('/upload', async (req, res) => {
  try {
    // Get active storage config
    const settings = await sql('SELECT value FROM site_settings WHERE key = $1', ['storage_config']);
    let config = settings.length ? settings[0].value : null;
    let provider = config?.active_provider || 'local';
    
    // Get image data from request
    let imageBuffer = null;
    let mimeType = 'image/jpeg';
    
    if (req.body?.image) {
      // Base64 image
      const matches = req.body.image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        imageBuffer = Buffer.from(req.body.image, 'base64');
      }
    } else if (req.body?.url) {
      // URL to download and re-upload
      const resp = await fetch(req.body.url);
      const arrayBuffer = await resp.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      mimeType = resp.headers.get('content-type') || 'image/jpeg';
    }
    
    if (!imageBuffer) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }
    
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    let publicUrl = '';
    
    if (provider === 'cloudinary' && config?.providers?.cloudinary?.enabled) {
      // Cloudinary upload
      const cloudinaryConfig = config.providers.cloudinary;
      const cloudName = cloudinaryConfig.cloud_name;
      const apiKey = cloudinaryConfig.api_key;
      const apiSecret = cloudinaryConfig.api_secret;
      
      const base64 = imageBuffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;
      
      // Build Cloudinary upload URL
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = require('crypto')
        .createHash('sha256')
        .update(`timestamp=${timestamp}${apiSecret}`)
        .digest('hex');
      
      const formData = new URLSearchParams();
      formData.append('file', dataUri);
      formData.append('timestamp', String(timestamp));
      formData.append('api_key', apiKey);
      formData.append('signature', signature);
      formData.append('folder', 'tdev-uploads');
      
      const cloudResp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const cloudData = await cloudResp.json();
      
      if (cloudData.secure_url) {
        publicUrl = cloudData.secure_url;
      } else {
        throw new Error(cloudData.error?.message || 'Cloudinary upload failed');
      }
    } else if (provider === 'aws_s3' && config?.providers?.aws_s3?.enabled) {
      // For S3, return a pre-signed URL approach (actual SDK needed for production)
      publicUrl = `https://${config.providers.aws_s3.bucket}.s3.${config.providers.aws_s3.region}.amazonaws.com/tdev-uploads/${filename}`;
    } else {
      // Local storage fallback
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const uploadDir = path.resolve(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const ext = mimeType.split('/')[1] || 'jpg';
      const filePath = path.join(uploadDir, `${filename}.${ext}`);
      fs.writeFileSync(filePath, imageBuffer);
      publicUrl = `/uploads/${filename}.${ext}`;
    }
    
    return res.json({ success: true, data: { path: publicUrl, publicUrl } });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Upload failed' });
  }
});

// ══════════════════════════════════════════════
//  PAYMENT PROCESSING
// ══════════════════════════════════════════════

// POST /api/payments/initialize — Initialize a payment with the active gateway
router.post('/payments/initialize', async (req, res) => {
  try {
    const { amount, currency, email, metadata } = req.body;

    // Get active gateway config from site_settings
    const settings = await sql('SELECT value FROM site_settings WHERE key = $1', ['payment_gateways']);
    if (!settings.length) return res.status(400).json({ success: false, error: 'No payment gateway configured' });

    const config = settings[0].value;
    const activeGateway = config.active_gateway;
    if (!activeGateway || !config.gateways[activeGateway]?.enabled) {
      return res.status(400).json({ success: false, error: 'No active payment gateway' });
    }

    const gateway = config.gateways[activeGateway];

    // Route to the appropriate gateway
    if (activeGateway === 'stripe') {
      // Stripe: Create payment intent
      const stripeKey = gateway.publishable_key;
      // For now return a mock response
      return res.json({ success: true, data: {
        gateway: 'stripe',
        authorization_url: null,
        reference: 'stripe_' + Date.now(),
        amount, currency, email,
        mode: gateway.mode
      }});
    } else if (activeGateway === 'paystack') {
      // Paystack: Initialize transaction
      return res.json({ success: true, data: {
        gateway: 'paystack',
        authorization_url: `https://checkout.paystack.com/${Date.now()}`,
        reference: 'paystack_' + Date.now(),
        amount, currency, email,
        mode: gateway.mode
      }});
    } else if (activeGateway === 'flutterwave') {
      return res.json({ success: true, data: {
        gateway: 'flutterwave',
        authorization_url: `https://flutterwave.com/pay/${Date.now()}`,
        reference: 'flw_' + Date.now(),
        amount, currency, email,
        mode: gateway.mode
      }});
    } else if (activeGateway === 'paypal') {
      return res.json({ success: true, data: {
        gateway: 'paypal',
        authorization_url: null,
        reference: 'pp_' + Date.now(),
        amount, currency, email,
        mode: gateway.mode
      }});
    }

    return res.status(400).json({ success: false, error: 'Unsupported gateway' });
  } catch (err: any) {
    logger.error('Payment initialize error', { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to initialize payment' });
  }
});

// POST /api/payments/verify — Verify a payment after redirect
router.post('/payments/verify', async (req, res) => {
  try {
    const { reference, gateway } = req.body;
    // For now, return success (real implementation would verify with the gateway API)
    return res.json({ success: true, data: { status: 'success', reference, gateway } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// GET /api/payments/gateway — Get active gateway info for the checkout page
router.get('/payments/gateway', async (_req, res) => {
  try {
    const settings = await sql('SELECT value FROM site_settings WHERE key = $1', ['payment_gateways']);
    if (!settings.length) return res.json({ success: true, data: null });
    const config = settings[0].value;
    const active = config.active_gateway;
    if (!active || !config.gateways[active]?.enabled) return res.json({ success: true, data: null });

    return res.json({ success: true, data: {
      gateway: active,
      mode: config.gateways[active].mode,
      key: active === 'stripe' ? config.gateways[active].publishable_key
           : active === 'paypal' ? config.gateways[active].client_id
           : config.gateways[active].public_key
    }});
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to get gateway config' });
  }
});

export default router;
