var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// server/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";

// server/routes.ts
import { Router } from "express";
import { randomUUID } from "crypto";
import { neon, neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import jwt2 from "jsonwebtoken";

// server/middleware.ts
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
var JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
function authenticate(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}
function requireAdmin(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ success: false, error: "Admin access required" });
  }
  next();
}
var generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." }
});
var contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many contact submissions. Please try again later." }
});
var subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many subscription attempts. Please try again later." }
});
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts. Please try again later." }
});
function cacheControl(maxAge) {
  return (_req, res, next) => {
    res.set("Cache-Control", `public, max-age=${maxAge}, s-maxage=${maxAge * 2}`);
    next();
  };
}
function requestId(req, _res, next) {
  req.requestId = crypto.randomUUID().slice(0, 8);
  next();
}
function errorHandler(err, _req, res, _next) {
  console.error("Unhandled error:", err);
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: err.errors
    });
  }
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
  });
}

// server/validators.ts
import { z } from "zod";
var signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Display name is required").optional()
});
var loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
var contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(500),
  message: z.string().min(1, "Message is required")
});
var messageReplySchema = z.object({
  adminReply: z.string().min(1, "Reply is required")
});
var productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
  price: z.string().or(z.number()).default("0"),
  compareAtPrice: z.string().or(z.number()).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  images: z.array(z.string()).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  colors: z.array(z.string()).optional().default([]),
  inStock: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  sku: z.string().optional().nullable(),
  stockQuantity: z.number().int().optional().default(0),
  weight: z.string().or(z.number()).optional().nullable(),
  material: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  status: z.string().optional().default("published"),
  published: z.boolean().optional().default(true),
  isVisible: z.boolean().optional().default(true)
});
var categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  displayOrder: z.number().int().optional().default(0)
});
var orderSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional().default("pending"),
  total: z.string().or(z.number()).default("0"),
  shippingAddress: z.any().optional(),
  items: z.array(z.any()).optional().default([])
});
var orderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"])
});
var designRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional().nullable(),
  shirtColor: z.string().optional().default("white"),
  shirtSize: z.string().optional().default("M"),
  designImageUrl: z.string().optional().nullable(),
  designData: z.any().optional(),
  notes: z.string().optional().nullable(),
  quantity: z.number().int().min(1).optional().default(1)
});
var blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().optional().nullable(),
  published: z.boolean().optional().default(false),
  authorName: z.string().optional().default("TDEV"),
  tags: z.array(z.string()).optional().default([])
});
var announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  linkText: z.string().optional().nullable(),
  linkUrl: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0)
});
var discountCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discountPercent: z.number().int().min(1).max(100).default(10),
  gameName: z.string().min(1, "Game name is required"),
  expiresAt: z.string().optional()
});
var pageViewSchema = z.object({
  page: z.string().min(1, "Page is required"),
  visitorId: z.string().optional().nullable(),
  sessionDuration: z.number().int().optional().default(0)
});
var siteSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.any()
});
var subscribeSchema = z.object({
  email: z.string().email("Invalid email address")
});

// server/logger.ts
var isProduction = process.env.NODE_ENV === "production";
var logger = {
  info: (msg, meta) => {
    const entry = { level: "info", timestamp: (/* @__PURE__ */ new Date()).toISOString(), message: msg, ...meta };
    if (isProduction) console.log(JSON.stringify(entry));
    else console.log(`[INFO] ${msg}`, meta || "");
  },
  warn: (msg, meta) => {
    const entry = { level: "warn", timestamp: (/* @__PURE__ */ new Date()).toISOString(), message: msg, ...meta };
    if (isProduction) console.warn(JSON.stringify(entry));
    else console.warn(`[WARN] ${msg}`, meta || "");
  },
  error: (msg, meta) => {
    const entry = { level: "error", timestamp: (/* @__PURE__ */ new Date()).toISOString(), message: msg, ...meta };
    if (isProduction) console.error(JSON.stringify(entry));
    else console.error(`[ERROR] ${msg}`, meta || "");
  }
};

// server/routes.ts
neonConfig.fetchConnectionCache = true;
var uuidv4 = randomUUID;
var JWT_SECRET2 = process.env.JWT_SECRET;
if (!JWT_SECRET2) throw new Error("JWT_SECRET environment variable is required");
var _sql = null;
async function sql(query, params) {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return await _sql.query(query, params || []);
}
var router = Router();
function generateToken(userId, role = "user") {
  return jwt2.sign({ userId, role }, JWT_SECRET2, { expiresIn: "7d" });
}
function setAuthCookie(res, token) {
  const isProduction2 = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction2,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1e3,
    // 7 days
    path: "/"
  });
}
router.get("/health", cacheControl(0), async (_req, res) => {
  try {
    await sql("SELECT 1", []);
    res.json({ success: true, status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (err) {
    res.status(503).json({ success: false, status: "unhealthy", error: "Database connection failed" });
  }
});
router.post("/auth/signup", authLimiter, async (req, res) => {
  try {
    const data = signupSchema.parse(req.body);
    const existing = await sql(
      `SELECT id FROM profiles WHERE email = $1 LIMIT 1`,
      [data.email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await sql(
      `INSERT INTO profiles (id, user_id, email, display_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())`,
      [uuidv4(), userId, data.email, data.displayName || data.email.split("@")[0]]
    );
    await sql(
      `INSERT INTO user_roles (id, user_id, role) VALUES ($1, $2, $3)`,
      [uuidv4(), userId, "user"]
    );
    await sql(
      `INSERT INTO site_settings (id, key, value) VALUES ($1, $2, $3)`,
      [uuidv4(), `auth_${userId}`, JSON.stringify({ password: hashedPassword })]
    );
    const token = generateToken(userId, "user");
    setAuthCookie(res, token);
    return res.status(201).json({
      success: true,
      token,
      user: { id: userId, email: data.email, displayName: data.displayName, role: "user" }
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    logger.error("Signup error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/auth/login", authLimiter, async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const users = await sql(
      `SELECT id, user_id, email, display_name, avatar_url FROM profiles WHERE email = $1 LIMIT 1`,
      [data.email]
    );
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }
    const user = users[0];
    const authRecords = await sql(
      `SELECT value FROM site_settings WHERE key = $1 LIMIT 1`,
      [`auth_${user.user_id}`]
    );
    if (authRecords.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }
    const { password: hashedPassword } = authRecords[0].value;
    const valid = await bcrypt.compare(data.password, hashedPassword);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }
    const roles = await sql(
      `SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1`,
      [user.user_id]
    );
    const role = roles.length > 0 ? roles[0].role : "user";
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
        role
      }
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    logger.error("Login error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/auth/me", authenticate, async (req, res) => {
  try {
    const users = await sql(
      `SELECT p.user_id, p.email, p.display_name, p.avatar_url, COALESCE(ur.role, 'user') as role 
       FROM profiles p 
       LEFT JOIN user_roles ur ON ur.user_id = p.user_id 
       WHERE p.user_id = $1 LIMIT 1`,
      [req.userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const user = users[0];
    return res.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        role: user.role
      }
    });
  } catch (err) {
    logger.error("Auth me error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/auth/logout", (_req, res) => {
  res.clearCookie("token", { path: "/" });
  return res.json({ success: true, message: "Logged out" });
});
router.post("/auth/reset-password", async (_req, res) => {
  return res.json({ success: true, message: "Password reset request received" });
});
router.put("/auth/me", authenticate, async (req, res) => {
  try {
    const { password, displayName, avatarUrl } = req.body;
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
    if (displayName !== void 0 || avatarUrl !== void 0) {
      await sql(
        `UPDATE profiles SET display_name = COALESCE($1, display_name), avatar_url = COALESCE($2, avatar_url), updated_at = now()
         WHERE user_id = $3`,
        [displayName || null, avatarUrl || null, req.userId]
      );
    }
    return res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    logger.error("PUT /auth/me error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.put("/auth/profile", authenticate, async (req, res) => {
  try {
    const { displayName, avatarUrl } = req.body;
    await sql(
      `UPDATE profiles SET display_name = COALESCE($1, display_name), avatar_url = COALESCE($2, avatar_url), updated_at = now()
       WHERE user_id = $3`,
      [displayName || null, avatarUrl || null, req.userId]
    );
    return res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    logger.error("Profile update error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/products", cacheControl(60), async (_req, res) => {
  try {
    const rows = await sql(`SELECT * FROM products ORDER BY created_at DESC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Products fetch error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/products/id/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await sql(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error("Product fetch by id error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/products/:slug", async (req, res) => {
  try {
    const rows = await sql(`SELECT * FROM products WHERE slug = $1 LIMIT 1`, [req.params.slug]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error("Product fetch error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/products", authenticate, requireAdmin, async (req, res) => {
  try {
    const data = productSchema.parse(req.body);
    const id = uuidv4();
    await sql(
      `INSERT INTO products (id, name, slug, description, price, compare_at_price, category_id, images, sizes, colors, in_stock, featured, sku, stock_quantity, weight, material, brand, tags, status, published, is_visible, published_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, now(), now(), now())`,
      [
        id,
        data.name,
        data.slug,
        data.description || null,
        String(data.price),
        data.compareAtPrice ? String(data.compareAtPrice) : null,
        data.categoryId || null,
        JSON.stringify(data.images || []),
        JSON.stringify(data.sizes || []),
        JSON.stringify(data.colors || []),
        data.inStock ?? true,
        data.featured ?? false,
        data.sku || null,
        data.stockQuantity ?? 0,
        data.weight ? String(data.weight) : null,
        data.material || null,
        data.brand || null,
        JSON.stringify(data.tags || []),
        data.status || "published",
        data.published ?? true,
        data.isVisible ?? true
      ]
    );
    const product = await sql(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [id]);
    return res.status(201).json({ success: true, data: product[0] });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    logger.error("Product create error", { error: err.message });
    const message = process.env.NODE_ENV === "production" ? "Failed to create product" : err.message;
    return res.status(500).json({ success: false, error: message });
  }
});
router.put("/products/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(data)) {
      const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      if (value !== void 0) {
        fields.push(`${dbKey} = $${idx++}`);
        values.push(Array.isArray(value) ? JSON.stringify(value) : value);
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }
    fields.push(`updated_at = now()`);
    values.push(req.params.id);
    await sql(
      `UPDATE products SET ${fields.join(", ")} WHERE id = $${idx}`,
      values
    );
    const updated = await sql(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [req.params.id]);
    return res.json({ success: true, data: updated[0] });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    logger.error("Product update error", { error: err.message });
    const message = process.env.NODE_ENV === "production" ? "Failed to update product" : err.message;
    return res.status(500).json({ success: false, error: message });
  }
});
router.delete("/products/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await sql(`DELETE FROM products WHERE id = $1`, [req.params.id]);
    return res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    logger.error("Product delete error", { error: err.message });
    const message = process.env.NODE_ENV === "production" ? "Failed to delete product" : err.message;
    return res.status(500).json({ success: false, error: message });
  }
});
router.get("/categories", cacheControl(300), async (_req, res) => {
  try {
    const rows = await sql(`SELECT * FROM categories ORDER BY display_order ASC, name ASC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Categories fetch error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/categories", authenticate, requireAdmin, async (req, res) => {
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
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    logger.error("Category create error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.put("/categories/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(data)) {
      if (value !== void 0) {
        const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        fields.push(`${dbKey} = $${idx++}`);
        values.push(value);
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }
    fields.push(`updated_at = now()`);
    values.push(req.params.id);
    await sql(`UPDATE categories SET ${fields.join(", ")} WHERE id = $${idx}`, values);
    const updated = await sql(`SELECT * FROM categories WHERE id = $1 LIMIT 1`, [req.params.id]);
    return res.json({ success: true, data: updated[0] });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.delete("/categories/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await sql(`DELETE FROM categories WHERE id = $1`, [req.params.id]);
    return res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/contact", contactLimiter, async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);
    const id = uuidv4();
    await sql(
      `INSERT INTO messages (id, name, email, subject, message, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'unread', now(), now())`,
      [id, data.name, data.email, data.subject, data.message]
    );
    return res.status(201).json({ success: true, id });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    logger.error("Contact submit error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/messages", authenticate, requireAdmin, async (_req, res) => {
  try {
    const rows = await sql(`SELECT * FROM messages ORDER BY created_at DESC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.put("/messages/:id/reply", authenticate, requireAdmin, async (req, res) => {
  try {
    const data = messageReplySchema.parse(req.body);
    await sql(
      `UPDATE messages SET admin_reply = $1, replied_at = now(), status = 'replied', updated_at = now()
       WHERE id = $2`,
      [data.adminReply, req.params.id]
    );
    return res.json({ success: true, message: "Reply sent" });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.put("/messages/:id/status", authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await sql(`UPDATE messages SET status = $1, updated_at = now() WHERE id = $2`, [status, req.params.id]);
    return res.json({ success: true, message: "Status updated" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/design-requests", async (req, res) => {
  try {
    const data = designRequestSchema.parse(req.body);
    const id = uuidv4();
    await sql(
      `INSERT INTO custom_design_requests (id, name, email, phone, shirt_color, shirt_size, design_image_url, design_data, notes, quantity, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', now(), now())`,
      [
        id,
        data.name,
        data.email,
        data.phone || null,
        data.shirtColor || "white",
        data.shirtSize || "M",
        data.designImageUrl || null,
        JSON.stringify(data.designData || {}),
        data.notes || null,
        data.quantity ?? 1
      ]
    );
    return res.status(201).json({ success: true, id });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    logger.error("Design request error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/design-requests", authenticate, requireAdmin, async (_req, res) => {
  try {
    const rows = await sql(`SELECT * FROM custom_design_requests ORDER BY created_at DESC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.put("/design-requests/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes, quotedPrice } = req.body;
    await sql(
      `UPDATE custom_design_requests SET status = COALESCE($1, status), admin_notes = COALESCE($2, admin_notes), quoted_price = COALESCE($3, quoted_price), updated_at = now() WHERE id = $4`,
      [status || null, adminNotes || null, quotedPrice ? String(quotedPrice) : null, req.params.id]
    );
    return res.json({ success: true, message: "Design request updated" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/orders", authenticate, async (req, res) => {
  try {
    let rows;
    if (req.userRole === "admin") {
      rows = await sql(`SELECT * FROM orders ORDER BY created_at DESC`);
    } else {
      rows = await sql(`SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`, [req.userId]);
    }
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/orders", authenticate, async (req, res) => {
  try {
    const data = orderSchema.parse(req.body);
    const id = uuidv4();
    await sql(
      `INSERT INTO orders (id, user_id, status, total, shipping_address, items, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
      [
        id,
        req.userId,
        data.status || "pending",
        String(data.total || 0),
        JSON.stringify(data.shippingAddress || {}),
        JSON.stringify(data.items || [])
      ]
    );
    const order = await sql(`SELECT * FROM orders WHERE id = $1 LIMIT 1`, [id]);
    return res.status(201).json({ success: true, data: order[0] });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.put("/orders/:id/status", authenticate, requireAdmin, async (req, res) => {
  try {
    const data = orderStatusSchema.parse(req.body);
    await sql(`UPDATE orders SET status = $1, updated_at = now() WHERE id = $2`, [data.status, req.params.id]);
    return res.json({ success: true, message: "Order status updated" });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/blog", cacheControl(120), async (req, res) => {
  try {
    const publishedOnly = req.query.published !== "false";
    let rows;
    if (publishedOnly) {
      rows = await sql(`SELECT * FROM blog_posts WHERE published = true ORDER BY created_at DESC`);
    } else {
      rows = await sql(`SELECT * FROM blog_posts ORDER BY created_at DESC`);
    }
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/blog/:slug", async (req, res) => {
  try {
    const rows = await sql(`SELECT * FROM blog_posts WHERE slug = $1 LIMIT 1`, [req.params.slug]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Blog post not found" });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/blog", authenticate, requireAdmin, async (req, res) => {
  try {
    const data = blogPostSchema.parse(req.body);
    const id = uuidv4();
    await sql(
      `INSERT INTO blog_posts (id, title, slug, excerpt, content, cover_image, published, author_name, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())`,
      [
        id,
        data.title,
        data.slug,
        data.excerpt || null,
        data.content,
        data.coverImage || null,
        data.published ?? false,
        data.authorName || "TDEV",
        JSON.stringify(data.tags || [])
      ]
    );
    const post = await sql(`SELECT * FROM blog_posts WHERE id = $1 LIMIT 1`, [id]);
    return res.status(201).json({ success: true, data: post[0] });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.put("/blog/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const data = blogPostSchema.partial().parse(req.body);
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(data)) {
      if (value !== void 0) {
        const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        fields.push(`${dbKey} = $${idx++}`);
        values.push(Array.isArray(value) ? JSON.stringify(value) : value);
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }
    fields.push(`updated_at = now()`);
    values.push(req.params.id);
    await sql(`UPDATE blog_posts SET ${fields.join(", ")} WHERE id = $${idx}`, values);
    const updated = await sql(`SELECT * FROM blog_posts WHERE id = $1 LIMIT 1`, [req.params.id]);
    return res.json({ success: true, data: updated[0] });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.delete("/blog/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await sql(`DELETE FROM blog_posts WHERE id = $1`, [req.params.id]);
    return res.json({ success: true, message: "Blog post deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/announcements", cacheControl(60), async (_req, res) => {
  try {
    const rows = await sql(`SELECT * FROM announcements WHERE active = true ORDER BY display_order ASC, created_at DESC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/announcements", authenticate, requireAdmin, async (req, res) => {
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
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.put("/announcements/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, message, linkText, linkUrl, active, displayOrder } = req.body;
    await sql(
      `UPDATE announcements SET title = COALESCE($1, title), message = COALESCE($2, message), link_text = COALESCE($3, link_text), link_url = COALESCE($4, link_url), active = COALESCE($5, active), display_order = COALESCE($6, display_order), updated_at = now() WHERE id = $7`,
      [title || null, message || null, linkText || null, linkUrl || null, active !== void 0 ? active : null, displayOrder !== void 0 ? displayOrder : null, req.params.id]
    );
    return res.json({ success: true, message: "Announcement updated" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.delete("/announcements/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await sql(`DELETE FROM announcements WHERE id = $1`, [req.params.id]);
    return res.json({ success: true, message: "Announcement deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/discount-codes", authenticate, requireAdmin, async (_req, res) => {
  try {
    const rows = await sql(`SELECT * FROM discount_codes ORDER BY created_at DESC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/discount-codes", authenticate, requireAdmin, async (req, res) => {
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
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/discount-codes/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: "Code is required" });
    }
    const rows = await sql(
      `SELECT * FROM discount_codes WHERE code = $1 AND used = false AND expires_at > now() LIMIT 1`,
      [code.toUpperCase()]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Invalid or expired discount code" });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/page-views", async (req, res) => {
  try {
    const data = pageViewSchema.parse(req.body);
    const id = uuidv4();
    await sql(
      `INSERT INTO page_views (id, page, visitor_id, session_duration, created_at) VALUES ($1, $2, $3, $4, now())`,
      [id, data.page, data.visitorId || null, data.sessionDuration ?? 0]
    );
    return res.status(201).json({ success: true, id });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/page-views/stats", authenticate, requireAdmin, async (_req, res) => {
  try {
    const rows = await sql(`
      SELECT page, COUNT(*) as views, COUNT(DISTINCT visitor_id) as unique_visitors
      FROM page_views
      GROUP BY page
      ORDER BY views DESC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/settings", cacheControl(60), async (_req, res) => {
  try {
    const rows = await sql(`SELECT key, value, updated_at FROM site_settings`);
    const settings = {};
    for (const row of rows) {
      if (!row.key.startsWith("auth_")) {
        settings[row.key] = row.value;
      }
    }
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.put("/settings/:key", authenticate, requireAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    const { key } = req.params;
    const existing = await sql(`SELECT id FROM site_settings WHERE key = $1 LIMIT 1`, [key]);
    if (existing.length > 0) {
      await sql(`UPDATE site_settings SET value = $1, updated_at = now() WHERE key = $2`, [JSON.stringify(value), key]);
    } else {
      await sql(`INSERT INTO site_settings (id, key, value, updated_at) VALUES ($1, $2, $3, now())`, [uuidv4(), key, JSON.stringify(value)]);
    }
    return res.json({ success: true, message: "Setting saved" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/subscribe", subscribeLimiter, async (req, res) => {
  try {
    const data = subscribeSchema.parse(req.body);
    const existing = await sql(
      `SELECT id FROM site_settings WHERE key = $1 LIMIT 1`,
      [`subscriber_${data.email}`]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: "This email is already subscribed" });
    }
    await sql(
      `INSERT INTO site_settings (id, key, value, updated_at) VALUES ($1, $2, $3, now())`,
      [uuidv4(), `subscriber_${data.email}`, JSON.stringify({ email: data.email, subscribedAt: (/* @__PURE__ */ new Date()).toISOString() })]
    );
    return res.status(201).json({ success: true, message: "Subscribed successfully" });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/subscribers", authenticate, requireAdmin, async (_req, res) => {
  try {
    const rows = await sql(`SELECT value FROM site_settings WHERE key LIKE 'subscriber_%' ORDER BY updated_at DESC`);
    const subscribers = rows.map((r) => r.value);
    return res.json({ success: true, data: subscribers });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.get("/profiles", authenticate, requireAdmin, async (_req, res) => {
  try {
    const rows = await sql(`SELECT * FROM profiles ORDER BY created_at DESC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.put("/users/:userId/role", authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "editor", "user"].includes(role)) {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }
    const existing = await sql(`SELECT id FROM user_roles WHERE user_id = $1 LIMIT 1`, [req.params.userId]);
    if (existing.length > 0) {
      await sql(`UPDATE user_roles SET role = $1 WHERE user_id = $2`, [role, req.params.userId]);
    } else {
      await sql(`INSERT INTO user_roles (id, user_id, role) VALUES ($1, $2, $3)`, [uuidv4(), req.params.userId, role]);
    }
    return res.json({ success: true, message: "Role updated" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/functions/detect-region", async (_req, res) => {
  return res.json({ data: { country: "US", currency: "USD", locale: "en-US" }, error: null });
});
router.post("/functions/game-coupon", async (req, res) => {
  const { action } = req.body || {};
  if (action === "claim") {
    return res.json({ data: { success: true, code: "GAME-123", discountPercent: 10 }, error: null });
  }
  if (action === "validate") {
    return res.json({ data: { valid: true, discountPercent: 10 }, error: null });
  }
  return res.json({ data: null, error: new Error("Unknown action") });
});
router.get("/storage/config", async (_req, res) => {
  try {
    const settings = await sql("SELECT value FROM site_settings WHERE key = $1", ["storage_config"]);
    return res.json({ success: true, data: settings.length ? settings[0].value : null });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to get storage config" });
  }
});
router.post("/upload", async (req, res) => {
  try {
    const settings = await sql("SELECT value FROM site_settings WHERE key = $1", ["storage_config"]);
    let config = settings.length ? settings[0].value : null;
    let provider = config?.active_provider || "local";
    let imageBuffer = null;
    let mimeType = "image/jpeg";
    if (req.body?.image) {
      const matches = req.body.image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBuffer = Buffer.from(matches[2], "base64");
      } else {
        imageBuffer = Buffer.from(req.body.image, "base64");
      }
    } else if (req.body?.url) {
      const resp = await fetch(req.body.url);
      const arrayBuffer = await resp.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      mimeType = resp.headers.get("content-type") || "image/jpeg";
    }
    if (!imageBuffer) {
      return res.status(400).json({ success: false, error: "No image data provided" });
    }
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    let publicUrl = "";
    if (provider === "cloudinary" && config?.providers?.cloudinary?.enabled) {
      const cloudinaryConfig = config.providers.cloudinary;
      const cloudName = cloudinaryConfig.cloud_name;
      const apiKey = cloudinaryConfig.api_key;
      const apiSecret = cloudinaryConfig.api_secret;
      const base64 = imageBuffer.toString("base64");
      const dataUri = `data:${mimeType};base64,${base64}`;
      const timestamp = Math.floor(Date.now() / 1e3);
      const signature = __require("crypto").createHash("sha256").update(`timestamp=${timestamp}${apiSecret}`).digest("hex");
      const formData = new URLSearchParams();
      formData.append("file", dataUri);
      formData.append("timestamp", String(timestamp));
      formData.append("api_key", apiKey);
      formData.append("signature", signature);
      formData.append("folder", "tdev-uploads");
      const cloudResp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      const cloudData = await cloudResp.json();
      if (cloudData.secure_url) {
        publicUrl = cloudData.secure_url;
      } else {
        throw new Error(cloudData.error?.message || "Cloudinary upload failed");
      }
    } else if (provider === "aws_s3" && config?.providers?.aws_s3?.enabled) {
      publicUrl = `https://${config.providers.aws_s3.bucket}.s3.${config.providers.aws_s3.region}.amazonaws.com/tdev-uploads/${filename}`;
    } else {
      const fs = await import("fs");
      const path2 = await import("path");
      const { fileURLToPath: fileURLToPath2 } = await import("url");
      const __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
      const uploadDir = path2.resolve(__dirname2, "..", "uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const ext = mimeType.split("/")[1] || "jpg";
      const filePath = path2.join(uploadDir, `${filename}.${ext}`);
      fs.writeFileSync(filePath, imageBuffer);
      publicUrl = `/uploads/${filename}.${ext}`;
    }
    return res.json({ success: true, data: { path: publicUrl, publicUrl } });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ success: false, error: err.message || "Upload failed" });
  }
});
router.post("/payments/initialize", async (req, res) => {
  try {
    const { amount, currency, email, metadata } = req.body;
    const settings = await sql("SELECT value FROM site_settings WHERE key = $1", ["payment_gateways"]);
    if (!settings.length) return res.status(400).json({ success: false, error: "No payment gateway configured" });
    const config = settings[0].value;
    const activeGateway = config.active_gateway;
    if (!activeGateway || !config.gateways[activeGateway]?.enabled) {
      return res.status(400).json({ success: false, error: "No active payment gateway" });
    }
    const gateway = config.gateways[activeGateway];
    if (activeGateway === "stripe") {
      const stripeKey = gateway.publishable_key;
      return res.json({ success: true, data: {
        gateway: "stripe",
        authorization_url: null,
        reference: "stripe_" + Date.now(),
        amount,
        currency,
        email,
        mode: gateway.mode
      } });
    } else if (activeGateway === "paystack") {
      return res.json({ success: true, data: {
        gateway: "paystack",
        authorization_url: `https://checkout.paystack.com/${Date.now()}`,
        reference: "paystack_" + Date.now(),
        amount,
        currency,
        email,
        mode: gateway.mode
      } });
    } else if (activeGateway === "flutterwave") {
      return res.json({ success: true, data: {
        gateway: "flutterwave",
        authorization_url: `https://flutterwave.com/pay/${Date.now()}`,
        reference: "flw_" + Date.now(),
        amount,
        currency,
        email,
        mode: gateway.mode
      } });
    } else if (activeGateway === "paypal") {
      return res.json({ success: true, data: {
        gateway: "paypal",
        authorization_url: null,
        reference: "pp_" + Date.now(),
        amount,
        currency,
        email,
        mode: gateway.mode
      } });
    }
    return res.status(400).json({ success: false, error: "Unsupported gateway" });
  } catch (err) {
    logger.error("Payment initialize error", { error: err.message });
    return res.status(500).json({ success: false, error: "Failed to initialize payment" });
  }
});
router.post("/payments/verify", async (req, res) => {
  try {
    const { reference, gateway } = req.body;
    return res.json({ success: true, data: { status: "success", reference, gateway } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Verification failed" });
  }
});
router.get("/payments/gateway", async (_req, res) => {
  try {
    const settings = await sql("SELECT value FROM site_settings WHERE key = $1", ["payment_gateways"]);
    if (!settings.length) return res.json({ success: true, data: null });
    const config = settings[0].value;
    const active = config.active_gateway;
    if (!active || !config.gateways[active]?.enabled) return res.json({ success: true, data: null });
    return res.json({ success: true, data: {
      gateway: active,
      mode: config.gateways[active].mode,
      key: active === "stripe" ? config.gateways[active].publishable_key : active === "paypal" ? config.gateways[active].client_id : config.gateways[active].public_key
    } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to get gateway config" });
  }
});
var routes_default = router;

// server/app.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
function createApp() {
  const app2 = express();
  try {
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: 0.1
      });
      app2.use(Sentry.Handlers.requestHandler());
    }
  } catch (e) {
    console.warn("Sentry initialization skipped:", e.message);
  }
  app2.set("trust proxy", 1);
  app2.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app2.use(requestId);
  app2.use(cors({
    origin: process.env.NODE_ENV === "production" ? (process.env.CORS_ORIGIN || "https://tdev-site.vercel.app").split(",").map((s) => s.trim()) : ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
    credentials: true
  }));
  app2.use(express.json({ limit: "10mb" }));
  app2.use(express.urlencoded({ extended: true }));
  app2.use(cookieParser());
  app2.use("/api", generalLimiter);
  app2.use("/api", routes_default);
  const uploadDir = path.resolve(__dirname, "..", "uploads");
  app2.use("/uploads", express.static(uploadDir));
  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app2.use(express.static(staticPath));
  app2.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
  app2.use(errorHandler);
  return app2;
}

// scripts/api-entry.ts
var app = createApp();
var api_entry_default = app;
export {
  api_entry_default as default
};
