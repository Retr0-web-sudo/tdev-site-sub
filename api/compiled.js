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
var uuidv42 = randomUUID;
var JWT_SECRET2 = process.env.JWT_SECRET;
if (!JWT_SECRET2) console.warn("\u26A0\uFE0F  JWT_SECRET not set \u2014 auth will not work");
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
var NUMERIC_FIELDS = ["price", "compare_at_price", "stock_quantity", "weight", "total", "discount_percent", "quoted_price"];
function fixNumericFields(row) {
  if (!row) return row;
  const r = { ...row };
  for (const field of NUMERIC_FIELDS) {
    if (r[field] !== null && r[field] !== void 0) {
      r[field] = Number(r[field]);
    }
  }
  return r;
}
function fixNumericFieldsArray(rows) {
  return rows.map(fixNumericFields);
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
    const userId = uuidv42();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await sql(
      `INSERT INTO profiles (id, user_id, email, display_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())`,
      [uuidv42(), userId, data.email, data.displayName || data.email.split("@")[0]]
    );
    await sql(
      `INSERT INTO user_roles (id, user_id, role) VALUES ($1, $2, $3)`,
      [uuidv42(), userId, "user"]
    );
    await sql(
      `INSERT INTO site_settings (id, key, value) VALUES ($1, $2, $3)`,
      [uuidv42(), `auth_${userId}`, JSON.stringify({ password: hashedPassword })]
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
          [uuidv42(), `auth_${req.userId}`, JSON.stringify({ password: hashedPassword })]
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
    return res.json({ success: true, data: fixNumericFieldsArray(rows) });
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
    return res.json({ success: true, data: fixNumericFields(rows[0]) });
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
    return res.json({ success: true, data: fixNumericFields(rows[0]) });
  } catch (err) {
    logger.error("Product fetch error", { error: err.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/products", authenticate, requireAdmin, async (req, res) => {
  try {
    const data = productSchema.parse(req.body);
    const id = uuidv42();
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
    return res.status(201).json({ success: true, data: fixNumericFields(product[0]) });
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
    return res.json({ success: true, data: fixNumericFields(updated[0]) });
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
    const id = uuidv42();
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
    const id = uuidv42();
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
    const id = uuidv42();
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
    return res.json({ success: true, data: fixNumericFieldsArray(rows) });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
router.post("/orders", authenticate, async (req, res) => {
  try {
    const data = orderSchema.parse(req.body);
    const id = uuidv42();
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
    return res.status(201).json({ success: true, data: fixNumericFields(order[0]) });
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
    const id = uuidv42();
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
    const id = uuidv42();
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
    const id = uuidv42();
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
    const id = uuidv42();
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
      await sql(`INSERT INTO site_settings (id, key, value, updated_at) VALUES ($1, $2, $3, now())`, [uuidv42(), key, JSON.stringify(value)]);
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
      [uuidv42(), `subscriber_${data.email}`, JSON.stringify({ email: data.email, subscribedAt: (/* @__PURE__ */ new Date()).toISOString() })]
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
      await sql(`INSERT INTO user_roles (id, user_id, role) VALUES ($1, $2, $3)`, [uuidv42(), req.params.userId, role]);
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

// server/subscription-routes.ts
import { Router as Router2 } from "express";
import { randomUUID as randomUUID2 } from "crypto";
import { neon as neon2, neonConfig as neonConfig2 } from "@neondatabase/serverless";

// server/subscription-validators.ts
import { z as z2 } from "zod";
var subscriptionPlanSchema = z2.object({
  name: z2.string().min(1, "Name is required"),
  slug: z2.string().min(1, "Slug is required"),
  description: z2.string().optional().nullable(),
  price: z2.string().or(z2.number()).default("0"),
  interval: z2.enum(["monthly", "quarterly", "annual"]).default("monthly"),
  features: z2.array(z2.string()).optional().default([]),
  itemCountMin: z2.number().int().optional().default(1),
  itemCountMax: z2.number().int().optional().default(3),
  isActive: z2.boolean().optional().default(true),
  displayOrder: z2.number().int().optional().default(0)
});
var createSubscriptionSchema = z2.object({
  planId: z2.string().uuid("Invalid plan ID"),
  shippingAddress: z2.object({
    address: z2.string().optional(),
    city: z2.string().optional(),
    region: z2.string().optional(),
    phone: z2.string().optional(),
    notes: z2.string().optional()
  }).optional()
});
var updateSubscriptionSchema = z2.object({
  status: z2.enum(["active", "paused", "cancelled"]).optional(),
  planId: z2.string().uuid().optional(),
  shippingAddress: z2.any().optional()
});
var styleQuizSchema = z2.object({
  sizes: z2.object({
    top: z2.string().optional(),
    bottom: z2.string().optional(),
    dress: z2.string().optional(),
    shoe: z2.string().optional()
  }).optional(),
  preferredColors: z2.array(z2.string()).optional().default([]),
  preferredStyles: z2.array(z2.string()).optional().default([]),
  occasions: z2.array(z2.string()).optional().default([]),
  notes: z2.string().optional().nullable()
});
var shipOrderSchema = z2.object({
  trackingNumber: z2.string().optional(),
  estimatedDelivery: z2.string().optional(),
  notes: z2.string().optional()
});

// server/subscription-routes.ts
neonConfig2.fetchConnectionCache = true;
var uuidv43 = randomUUID2;
var _sql2 = null;
async function sql2(query, params) {
  if (!_sql2) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql2 = neon2(url);
  }
  return await _sql2.query(query, params || []);
}
var router2 = Router2();
var NUMERIC_FIELDS2 = ["price", "amount", "total"];
function fixNumeric(row) {
  if (!row) return row;
  const r = { ...row };
  for (const f of NUMERIC_FIELDS2) {
    if (r[f] !== null && r[f] !== void 0) r[f] = Number(r[f]);
  }
  if (r.features && typeof r.features === "string") {
    try {
      r.features = JSON.parse(r.features);
    } catch {
    }
  }
  if (r.sizes && typeof r.sizes === "string") {
    try {
      r.sizes = JSON.parse(r.sizes);
    } catch {
    }
  }
  if (r.items && typeof r.items === "string") {
    try {
      r.items = JSON.parse(r.items);
    } catch {
    }
  }
  if (r.shipping_address && typeof r.shipping_address === "string") {
    try {
      r.shipping_address = JSON.parse(r.shipping_address);
    } catch {
    }
  }
  if (r.style_preferences && typeof r.style_preferences === "string") {
    try {
      r.style_preferences = JSON.parse(r.style_preferences);
    } catch {
    }
  }
  return r;
}
function fixMany(rows) {
  return rows.map(fixNumeric);
}
router2.get("/subscription-plans", cacheControl(300), async (_req, res) => {
  try {
    const rows = await sql2("SELECT * FROM public.subscription_plans WHERE is_active = true ORDER BY display_order ASC");
    res.json({ success: true, data: fixMany(rows) });
  } catch (err) {
    logger.error("Failed to fetch plans", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch plans" });
  }
});
router2.get("/subscription-plans/:slug", cacheControl(300), async (req, res) => {
  try {
    const rows = await sql2("SELECT * FROM public.subscription_plans WHERE slug = $1 AND is_active = true", [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ success: false, error: "Plan not found" });
    res.json({ success: true, data: fixNumeric(rows[0]) });
  } catch (err) {
    logger.error("Failed to fetch plan", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch plan" });
  }
});
router2.post("/subscriptions", authenticate, async (req, res) => {
  try {
    const parsed = createSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    const userId = req.userId;
    const { planId, shippingAddress } = parsed.data;
    const plans = await sql2("SELECT * FROM public.subscription_plans WHERE id = $1 AND is_active = true", [planId]);
    if (!plans[0]) return res.status(404).json({ success: false, error: "Plan not found" });
    const existing = await sql2(
      "SELECT id FROM public.subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1",
      [userId]
    );
    if (existing[0]) return res.status(409).json({ success: false, error: "You already have an active subscription" });
    const quiz = await sql2("SELECT * FROM public.style_quizzes WHERE user_id = $1 LIMIT 1", [userId]);
    const now = /* @__PURE__ */ new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const id = uuidv43();
    await sql2(
      `INSERT INTO public.subscriptions (id, user_id, plan_id, status, shipping_address, style_preferences, current_period_start, current_period_end, next_billing_date)
       VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, $8)`,
      [
        id,
        userId,
        planId,
        JSON.stringify(shippingAddress || {}),
        JSON.stringify(quiz[0] ? { sizes: quiz[0].sizes, colors: quiz[0].preferred_colors, styles: quiz[0].preferred_styles } : {}),
        now.toISOString(),
        nextMonth.toISOString(),
        nextMonth.toISOString()
      ]
    );
    const sub = await sql2("SELECT * FROM public.subscriptions WHERE id = $1", [id]);
    res.status(201).json({ success: true, data: fixNumeric(sub[0]) });
  } catch (err) {
    logger.error("Failed to create subscription", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to create subscription" });
  }
});
router2.get("/subscriptions/mine", authenticate, async (req, res) => {
  try {
    const rows = await sql2(
      `SELECT s.*, sp.name as plan_name, sp.slug as plan_slug, sp.price as plan_price, sp.features as plan_features
       FROM public.subscriptions s
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC LIMIT 1`,
      [req.userId]
    );
    res.json({ success: true, data: fixMany(rows) });
  } catch (err) {
    logger.error("Failed to fetch subscription", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch subscription" });
  }
});
router2.patch("/subscriptions/:id", authenticate, async (req, res) => {
  try {
    const parsed = updateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    const { id } = req.params;
    const userId = req.userId;
    const existing = await sql2("SELECT * FROM public.subscriptions WHERE id = $1", [id]);
    if (!existing[0]) return res.status(404).json({ success: false, error: "Subscription not found" });
    if (existing[0].user_id !== userId && req.userRole !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (parsed.data.status) {
      fields.push(`status = $${idx++}`);
      values.push(parsed.data.status);
      if (parsed.data.status === "cancelled") {
        fields.push(`cancelled_at = $${idx++}`);
        values.push((/* @__PURE__ */ new Date()).toISOString());
      }
    }
    if (parsed.data.planId) {
      fields.push(`plan_id = $${idx++}`);
      values.push(parsed.data.planId);
    }
    if (parsed.data.shippingAddress) {
      fields.push(`shipping_address = $${idx++}`);
      values.push(JSON.stringify(parsed.data.shippingAddress));
    }
    fields.push(`updated_at = $${idx++}`);
    values.push((/* @__PURE__ */ new Date()).toISOString());
    values.push(id);
    await sql2(`UPDATE public.subscriptions SET ${fields.join(", ")} WHERE id = $${idx}`, values);
    const updated = await sql2("SELECT * FROM public.subscriptions WHERE id = $1", [id]);
    res.json({ success: true, data: fixNumeric(updated[0]) });
  } catch (err) {
    logger.error("Failed to update subscription", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to update subscription" });
  }
});
router2.post("/subscriptions/:id/cancel", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const existing = await sql2("SELECT * FROM public.subscriptions WHERE id = $1", [id]);
    if (!existing[0]) return res.status(404).json({ success: false, error: "Subscription not found" });
    if (existing[0].user_id !== userId && req.userRole !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    await sql2(
      "UPDATE public.subscriptions SET status = 'cancelled', cancelled_at = $1, updated_at = $1 WHERE id = $2",
      [(/* @__PURE__ */ new Date()).toISOString(), id]
    );
    const updated = await sql2("SELECT * FROM public.subscriptions WHERE id = $1", [id]);
    res.json({ success: true, data: fixNumeric(updated[0]) });
  } catch (err) {
    logger.error("Failed to cancel subscription", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to cancel subscription" });
  }
});
router2.post("/style-quiz", authenticate, async (req, res) => {
  try {
    const parsed = styleQuizSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    const userId = req.userId;
    const data = parsed.data;
    const existing = await sql2("SELECT id FROM public.style_quizzes WHERE user_id = $1", [userId]);
    if (existing[0]) {
      await sql2(
        `UPDATE public.style_quizzes
         SET sizes = $1, preferred_colors = $2, preferred_styles = $3, occasions = $4, notes = $5, completed_at = $6, updated_at = $6
         WHERE user_id = $7`,
        [JSON.stringify(data.sizes || {}), data.preferredColors, data.preferredStyles, data.occasions, data.notes, (/* @__PURE__ */ new Date()).toISOString(), userId]
      );
    } else {
      await sql2(
        `INSERT INTO public.style_quizzes (id, user_id, sizes, preferred_colors, preferred_styles, occasions, notes, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [uuidv43(), userId, JSON.stringify(data.sizes || {}), data.preferredColors, data.preferredStyles, data.occasions, data.notes, (/* @__PURE__ */ new Date()).toISOString()]
      );
    }
    const quiz = await sql2("SELECT * FROM public.style_quizzes WHERE user_id = $1", [userId]);
    res.json({ success: true, data: fixNumeric(quiz[0]) });
  } catch (err) {
    logger.error("Failed to save quiz", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to save quiz" });
  }
});
router2.get("/style-quiz/mine", authenticate, async (req, res) => {
  try {
    const rows = await sql2("SELECT * FROM public.style_quizzes WHERE user_id = $1", [req.userId]);
    res.json({ success: true, data: fixMany(rows) });
  } catch (err) {
    logger.error("Failed to fetch quiz", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch quiz" });
  }
});
router2.get("/subscription-orders/mine", authenticate, async (req, res) => {
  try {
    const rows = await sql2(
      `SELECT so.*, sp.name as plan_name
       FROM public.subscription_orders so
       JOIN public.subscriptions s ON so.subscription_id = s.id
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       WHERE so.user_id = $1
       ORDER BY so.created_at DESC`,
      [req.userId]
    );
    res.json({ success: true, data: fixMany(rows) });
  } catch (err) {
    logger.error("Failed to fetch orders", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
});
router2.get("/subscription-orders/:id", authenticate, async (req, res) => {
  try {
    const rows = await sql2("SELECT * FROM public.subscription_orders WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: "Order not found" });
    if (rows[0].user_id !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    res.json({ success: true, data: fixNumeric(rows[0]) });
  } catch (err) {
    logger.error("Failed to fetch order", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch order" });
  }
});
router2.get("/subscriptions", authenticate, async (req, res) => {
  try {
    const rows = await sql2(
      `SELECT s.*, sp.name as plan_name, sp.price as plan_price, sp.features as plan_features
       FROM public.subscriptions s
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.userId]
    );
    res.json({ success: true, data: fixMany(rows) });
  } catch (err) {
    logger.error("Failed to fetch subscriptions", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch subscriptions" });
  }
});
router2.get("/subscription-orders", authenticate, async (req, res) => {
  try {
    const rows = await sql2(
      `SELECT so.*, sp.name as plan_name
       FROM public.subscription_orders so
       JOIN public.subscriptions s ON so.subscription_id = s.id
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       WHERE so.user_id = $1
       ORDER BY so.created_at DESC`,
      [req.userId]
    );
    res.json({ success: true, data: fixMany(rows) });
  } catch (err) {
    logger.error("Failed to fetch subscription orders", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch subscription orders" });
  }
});
router2.post("/admin/subscription-orders/:id/ship", authenticate, requireAdmin, async (req, res) => {
  try {
    const parsed = shipOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    const { id } = req.params;
    const { trackingNumber } = parsed.data;
    await sql2(
      "UPDATE public.subscription_orders SET status = 'shipped', tracking_number = $1, shipped_at = $2, updated_at = $2 WHERE id = $3",
      [trackingNumber || null, (/* @__PURE__ */ new Date()).toISOString(), id]
    );
    const updated = await sql2("SELECT * FROM public.subscription_orders WHERE id = $1", [id]);
    res.json({ success: true, data: fixNumeric(updated[0]) });
  } catch (err) {
    logger.error("Failed to ship order", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to ship order" });
  }
});
router2.get("/admin/subscriptions", authenticate, requireAdmin, async (_req, res) => {
  try {
    const rows = await sql2(
      `SELECT s.*, sp.name as plan_name, sp.price as plan_price, p.display_name, p.email
       FROM public.subscriptions s
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       LEFT JOIN public.profiles p ON s.user_id = p.user_id
       ORDER BY s.created_at DESC`
    );
    res.json({ success: true, data: fixMany(rows) });
  } catch (err) {
    logger.error("Failed to fetch subscriptions", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch subscriptions" });
  }
});
router2.get("/admin/subscription-stats", authenticate, requireAdmin, async (_req, res) => {
  try {
    const [totalSubs, activeSubs, planBreakdown, revenue] = await Promise.all([
      sql2("SELECT COUNT(*)::int as count FROM public.subscriptions"),
      sql2("SELECT COUNT(*)::int as count FROM public.subscriptions WHERE status = 'active'"),
      sql2(`SELECT sp.name, COUNT(s.id)::int as count
           FROM public.subscription_plans sp
           LEFT JOIN public.subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
           GROUP BY sp.name ORDER BY sp.display_order`),
      sql2("SELECT COALESCE(SUM(amount), 0)::numeric as total FROM public.subscription_payments WHERE status = 'succeeded'")
    ]);
    res.json({
      success: true,
      data: {
        totalSubscriptions: totalSubs[0]?.count || 0,
        activeSubscriptions: activeSubs[0]?.count || 0,
        planBreakdown: fixMany(planBreakdown),
        totalRevenue: Number(revenue[0]?.total || 0)
      }
    });
  } catch (err) {
    logger.error("Failed to fetch stats", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});
router2.get("/subscription-plans/:slug/curate", cacheControl(60), async (req, res) => {
  try {
    const plans = await sql2("SELECT * FROM public.subscription_plans WHERE slug = $1 AND is_active = true", [req.params.slug]);
    if (!plans[0]) return res.status(404).json({ success: false, error: "Plan not found" });
    const plan = plans[0];
    const maxItems = plan.item_count_max || 5;
    const products = await sql2(
      `SELECT p.*, c.name as category_name
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       WHERE p.status = 'published' AND p.in_stock = true
       ORDER BY RANDOM()
       LIMIT $1`,
      [maxItems * 3]
    );
    const curated = [];
    const usedCategories = /* @__PURE__ */ new Set();
    for (const p of products) {
      if (curated.length >= maxItems) break;
      if (curated.length < (plan.item_count_min || 2) || !usedCategories.has(p.category_name)) {
        curated.push({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          category: p.category_name,
          sizes: p.sizes,
          colors: p.colors
        });
        usedCategories.add(p.category_name);
      }
    }
    res.json({ success: true, data: curated });
  } catch (err) {
    logger.error("Failed to curate products", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to curate products" });
  }
});
router2.post("/cron/billing", async (req, res) => {
  const secret = req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  try {
    const dueSubs = await sql2(
      `SELECT s.*, sp.price, sp.name as plan_name
       FROM public.subscriptions s
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       WHERE s.status = 'active' AND s.next_billing_date <= now()`
    );
    let billed = 0;
    let failed = 0;
    for (const sub of dueSubs) {
      try {
        await sql2(
          `INSERT INTO public.subscription_payments (id, subscription_id, user_id, amount, currency, payment_method, status, transaction_id, paid_at, created_at)
           VALUES ($1, $2, $3, $4, 'GHS', 'recurring', 'succeeded', $5, now(), now())`,
          [uuidv43(), sub.id, sub.user_id, sub.price, `txn_recurring_${Date.now()}_${sub.id.slice(0, 8)}`]
        );
        await sql2(
          `INSERT INTO public.subscription_orders (id, subscription_id, user_id, status, items, amount, shipping_address, created_at, updated_at)
           VALUES ($1, $2, $3, 'pending', '[]', $4, $5, now(), now())`,
          [uuidv43(), sub.id, sub.user_id, sub.price, sub.shipping_address || "{}"]
        );
        const nextDate = new Date(sub.next_billing_date);
        nextDate.setMonth(nextDate.getMonth() + 1);
        await sql2(
          "UPDATE public.subscriptions SET next_billing_date = $1, current_period_end = $1, updated_at = now() WHERE id = $2",
          [nextDate.toISOString(), sub.id]
        );
        billed++;
      } catch (err) {
        failed++;
        logger.error("Billing failed for subscription", { subscriptionId: sub.id, error: err });
      }
    }
    res.json({ success: true, data: { due: dueSubs.length, billed, failed } });
  } catch (err) {
    logger.error("Billing cron failed", { error: err.message });
    res.status(500).json({ success: false, error: "Billing cron failed" });
  }
});
router2.post("/admin/subscription-plans", authenticate, requireAdmin, async (req, res) => {
  try {
    const parsed = subscriptionPlanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    const d = parsed.data;
    const id = uuidv43();
    await sql2(
      `INSERT INTO public.subscription_plans (id, name, slug, description, price, interval, features, item_count_min, item_count_max, is_active, display_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())`,
      [id, d.name, d.slug, d.description || null, d.price, d.interval, JSON.stringify(d.features || []), d.itemCountMin, d.itemCountMax, d.isActive, d.displayOrder]
    );
    const plan = await sql2("SELECT * FROM public.subscription_plans WHERE id = $1", [id]);
    res.status(201).json({ success: true, data: fixNumeric(plan[0]) });
  } catch (err) {
    logger.error("Failed to create plan", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to create plan" });
  }
});
router2.put("/admin/subscription-plans/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = [];
    const values = [];
    let idx = 1;
    if (req.body.name !== void 0) {
      fields.push(`name = $${idx++}`);
      values.push(req.body.name);
    }
    if (req.body.slug !== void 0) {
      fields.push(`slug = $${idx++}`);
      values.push(req.body.slug);
    }
    if (req.body.description !== void 0) {
      fields.push(`description = $${idx++}`);
      values.push(req.body.description);
    }
    if (req.body.price !== void 0) {
      fields.push(`price = $${idx++}`);
      values.push(req.body.price);
    }
    if (req.body.interval !== void 0) {
      fields.push(`interval = $${idx++}`);
      values.push(req.body.interval);
    }
    if (req.body.features !== void 0) {
      fields.push(`features = $${idx++}`);
      values.push(JSON.stringify(req.body.features));
    }
    if (req.body.item_count_min !== void 0) {
      fields.push(`item_count_min = $${idx++}`);
      values.push(req.body.item_count_min);
    }
    if (req.body.item_count_max !== void 0) {
      fields.push(`item_count_max = $${idx++}`);
      values.push(req.body.item_count_max);
    }
    if (req.body.is_active !== void 0) {
      fields.push(`is_active = $${idx++}`);
      values.push(req.body.is_active);
    }
    if (req.body.display_order !== void 0) {
      fields.push(`display_order = $${idx++}`);
      values.push(req.body.display_order);
    }
    if (fields.length === 0) return res.status(400).json({ success: false, error: "No fields to update" });
    fields.push(`updated_at = $${idx++}`);
    values.push((/* @__PURE__ */ new Date()).toISOString());
    values.push(id);
    await sql2(`UPDATE public.subscription_plans SET ${fields.join(", ")} WHERE id = $${idx}`, values);
    const plan = await sql2("SELECT * FROM public.subscription_plans WHERE id = $1", [id]);
    res.json({ success: true, data: fixNumeric(plan[0]) });
  } catch (err) {
    logger.error("Failed to update plan", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to update plan" });
  }
});
router2.delete("/admin/subscription-plans/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await sql2("UPDATE public.subscription_plans SET is_active = false, updated_at = now() WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to deactivate plan", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to deactivate plan" });
  }
});
router2.get("/admin/subscription-orders", authenticate, requireAdmin, async (_req, res) => {
  try {
    const rows = await sql2(
      `SELECT so.*, sp.name as plan_name, p.display_name, p.email
       FROM public.subscription_orders so
       JOIN public.subscriptions s ON so.subscription_id = s.id
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       LEFT JOIN public.profiles p ON so.user_id = p.user_id
       ORDER BY so.created_at DESC`
    );
    res.json({ success: true, data: fixMany(rows) });
  } catch (err) {
    logger.error("Failed to fetch subscription orders", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch subscription orders" });
  }
});
router2.put("/admin/subscription-orders/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = [];
    const values = [];
    let idx = 1;
    if (req.body.status !== void 0) {
      fields.push(`status = $${idx++}`);
      values.push(req.body.status);
    }
    if (req.body.items !== void 0) {
      fields.push(`items = $${idx++}`);
      values.push(JSON.stringify(req.body.items));
    }
    if (req.body.tracking_number !== void 0) {
      fields.push(`tracking_number = $${idx++}`);
      values.push(req.body.tracking_number);
    }
    if (req.body.notes !== void 0) {
      fields.push(`notes = $${idx++}`);
      values.push(req.body.notes);
    }
    if (req.body.status === "shipped") {
      fields.push(`shipped_at = $${idx++}`);
      values.push((/* @__PURE__ */ new Date()).toISOString());
    }
    if (req.body.status === "delivered") {
      fields.push(`delivered_at = $${idx++}`);
      values.push((/* @__PURE__ */ new Date()).toISOString());
    }
    fields.push(`updated_at = $${idx++}`);
    values.push((/* @__PURE__ */ new Date()).toISOString());
    values.push(id);
    await sql2(`UPDATE public.subscription_orders SET ${fields.join(", ")} WHERE id = $${idx}`, values);
    const order = await sql2("SELECT * FROM public.subscription_orders WHERE id = $1", [id]);
    res.json({ success: true, data: fixNumeric(order[0]) });
  } catch (err) {
    logger.error("Failed to update order", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to update order" });
  }
});
router2.get("/admin/style-quizzes", authenticate, requireAdmin, async (_req, res) => {
  try {
    const rows = await sql2(
      `SELECT sq.*, p.display_name, p.email
       FROM public.style_quizzes sq
       LEFT JOIN public.profiles p ON sq.user_id = p.user_id
       ORDER BY sq.created_at DESC`
    );
    res.json({ success: true, data: fixMany(rows) });
  } catch (err) {
    logger.error("Failed to fetch quizzes", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch quizzes" });
  }
});
var subscription_routes_default = router2;

// server/wishlist-notification-routes.ts
import { Router as Router3 } from "express";
import { neon as neon3 } from "@neondatabase/serverless";
var _sql3 = null;
async function sql3(query, params) {
  if (!_sql3) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql3 = neon3(url);
  }
  return await _sql3.query(query, params || []);
}
var router3 = Router3();
router3.get("/wishlist", authenticate, async (req, res) => {
  try {
    const rows = await sql3(
      `SELECT w.*, p.name, p.slug, p.price, p.images, p.tier, p.sizes, p.colors, p.brand, p.in_stock
       FROM public.wishlists w
       JOIN public.products p ON w.product_id = p.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.userId]
    );
    const data = rows.map((r) => ({
      ...r,
      images: typeof r.images === "string" ? JSON.parse(r.images) : r.images,
      sizes: typeof r.sizes === "string" ? JSON.parse(r.sizes) : r.sizes,
      colors: typeof r.colors === "string" ? JSON.parse(r.colors) : r.colors
    }));
    res.json({ success: true, data });
  } catch (err) {
    logger.error("Failed to fetch wishlist", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch wishlist" });
  }
});
router3.post("/wishlist", authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, error: "Product ID required" });
    const existing = await sql3("SELECT id FROM public.wishlists WHERE user_id = $1 AND product_id = $2", [req.userId, productId]);
    if (existing[0]) return res.status(409).json({ success: false, error: "Already in wishlist" });
    const id = uuidv4();
    await sql3(
      "INSERT INTO public.wishlists (id, user_id, product_id, created_at) VALUES ($1, $2, $3, now())",
      [id, req.userId, productId]
    );
    res.status(201).json({ success: true, data: { id, product_id: productId } });
  } catch (err) {
    logger.error("Failed to add to wishlist", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to add to wishlist" });
  }
});
router3.delete("/wishlist/:productId", authenticate, async (req, res) => {
  try {
    await sql3("DELETE FROM public.wishlists WHERE user_id = $1 AND product_id = $2", [req.userId, req.params.productId]);
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to remove from wishlist", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to remove from wishlist" });
  }
});
router3.get("/notifications", authenticate, async (req, res) => {
  try {
    const rows = await sql3(
      "SELECT * FROM public.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [req.userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error("Failed to fetch notifications", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});
router3.get("/notifications/unread-count", authenticate, async (req, res) => {
  try {
    const rows = await sql3(
      "SELECT COUNT(*)::int as count FROM public.notifications WHERE user_id = $1 AND read = false",
      [req.userId]
    );
    res.json({ success: true, data: { count: rows[0]?.count || 0 } });
  } catch (err) {
    logger.error("Failed to count notifications", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to count notifications" });
  }
});
router3.put("/notifications/:id/read", authenticate, async (req, res) => {
  try {
    await sql3("UPDATE public.notifications SET read = true WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to mark notification read", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to mark notification" });
  }
});
router3.put("/notifications/read-all", authenticate, async (req, res) => {
  try {
    await sql3("UPDATE public.notifications SET read = true WHERE user_id = $1 AND read = false", [req.userId]);
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to mark all read", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to mark all read" });
  }
});
async function createNotification(userId, type, title, message, data) {
  try {
    await sql3(
      "INSERT INTO public.notifications (id, user_id, type, title, message, data, created_at) VALUES ($1, $2, $3, $4, $5, $6, now())",
      [uuidv4(), userId, type, title, message, data ? JSON.stringify(data) : null]
    );
  } catch (err) {
    logger.error("Failed to create notification", { error: err });
  }
}
router3.get("/monthly-box/current", authenticate, async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const rows = await sql3(
      `SELECT mb.*, sp.name as plan_name, sp.price as plan_price, sp.item_count_min, sp.item_count_max
       FROM public.monthly_boxes mb
       JOIN public.subscriptions s ON mb.subscription_id = s.id
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1 AND mb.month >= $2 AND mb.month <= $3
       ORDER BY mb.created_at DESC LIMIT 1`,
      [req.userId, monthStart, monthEnd]
    );
    if (rows[0]) {
      const box = rows[0];
      box.items = typeof box.items === "string" ? JSON.parse(box.items) : box.items;
      return res.json({ success: true, data: box });
    }
    const subs = await sql3(
      `SELECT s.*, sp.name as plan_name, sp.price as plan_price, sp.item_count_min, sp.item_count_max
       FROM public.subscriptions s
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1 AND s.status = 'active'`,
      [req.userId]
    );
    if (!subs[0]) {
      return res.json({ success: true, data: null });
    }
    const sub = subs[0];
    const boxId = uuidv4();
    await sql3(
      `INSERT INTO public.monthly_boxes (id, subscription_id, user_id, month, items, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, '[]', 'building', now(), now())`,
      [boxId, sub.id, req.userId, now.toISOString()]
    );
    res.json({
      success: true,
      data: {
        id: boxId,
        subscription_id: sub.id,
        plan_name: sub.plan_name,
        plan_price: Number(sub.price),
        item_count_min: sub.item_count_min,
        item_count_max: sub.item_count_max,
        items: [],
        status: "building",
        month: now.toISOString()
      }
    });
  } catch (err) {
    logger.error("Failed to get current box", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to get current box" });
  }
});
router3.put("/monthly-box/:id", authenticate, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: "Items must be an array" });
    await sql3(
      "UPDATE public.monthly_boxes SET items = $1, updated_at = now() WHERE id = $2 AND user_id = $3",
      [JSON.stringify(items), req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to update box", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to update box" });
  }
});
router3.post("/monthly-box/:id/confirm", authenticate, async (req, res) => {
  try {
    await sql3(
      "UPDATE public.monthly_boxes SET status = 'confirmed', updated_at = now() WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    await createNotification(req.userId, "box_confirmed", "Box Confirmed!", "Your monthly box has been confirmed and is being prepared.");
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to confirm box", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to confirm box" });
  }
});
router3.post("/admin/notifications/send", async (req, res) => {
  try {
    const { userId, type, title, message } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, error: "userId, title, and message required" });
    }
    await createNotification(userId, type || "admin", title, message);
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to send notification", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to send notification" });
  }
});
router3.post("/admin/notifications/broadcast", async (req, res) => {
  try {
    const { type, title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: "title and message required" });
    }
    const subs = await sql3("SELECT DISTINCT user_id FROM public.subscriptions WHERE status = 'active'");
    let sent = 0;
    for (const sub of subs) {
      await createNotification(sub.user_id, type || "announcement", title, message);
      sent++;
    }
    res.json({ success: true, data: { sent } });
  } catch (err) {
    logger.error("Failed to broadcast", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to broadcast" });
  }
});
var wishlist_notification_routes_default = router3;

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
  app2.use("/api", subscription_routes_default);
  app2.use("/api", wishlist_notification_routes_default);
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
