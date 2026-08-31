import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  numeric,
  boolean,
  jsonb,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ── Enums ──
export const appRoleEnum = pgEnum('app_role', ['admin', 'moderator', 'user']);

// ── Profiles (linked to auth users) ──
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── User Roles ──
export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id').notNull(),
  role: appRoleEnum('role').notNull(),
});

// ── Products ──
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).default('0').notNull(),
  compareAtPrice: numeric('compare_at_price', { precision: 10, scale: 2 }),
  categoryId: uuid('category_id'),
  images: text('images').array().default([]),
  sizes: text('sizes').array().default([]),
  colors: text('colors').array().default([]),
  inStock: boolean('in_stock').default(true),
  featured: boolean('featured').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  shopifyProductId: bigint('shopify_product_id', { mode: 'number' }),
  shopifySyncedAt: timestamp('shopify_synced_at', { withTimezone: true }),
  sku: text('sku'),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  weight: numeric('weight'),
  material: text('material'),
  brand: text('brand'),
  tags: text('tags').array().default([]),
  videos: text('videos').array().default([]).notNull(),
  status: text('status').default('published'),
  published: boolean('published').default(true),
  isVisible: boolean('is_visible').default(true),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow(),
});

// ── Categories ──
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Orders ──
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id'),
  status: text('status').default('pending').notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).default('0').notNull(),
  shippingAddress: jsonb('shipping_address'),
  items: jsonb('items').default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Custom Design Requests ──
export const customDesignRequests = pgTable('custom_design_requests', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  shirtColor: text('shirt_color').default('white').notNull(),
  shirtSize: text('shirt_size').default('M').notNull(),
  designImageUrl: text('design_image_url'),
  designData: jsonb('design_data').default({}),
  notes: text('notes'),
  quantity: integer('quantity').default(1).notNull(),
  status: text('status').default('pending').notNull(),
  adminNotes: text('admin_notes'),
  quotedPrice: numeric('quoted_price'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Messages (Contact Form) ──
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').default('unread').notNull(),
  adminReply: text('admin_reply'),
  repliedAt: timestamp('replied_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Discount Codes ──
export const discountCodes = pgTable('discount_codes', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  code: text('code').notNull(),
  discountPercent: integer('discount_percent').default(10).notNull(),
  gameName: text('game_name').notNull(),
  used: boolean('used').default(false).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).default(sql`(now() + interval '7 days')`).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Blog Posts ──
export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  coverImage: text('cover_image'),
  published: boolean('published').default(false).notNull(),
  authorName: text('author_name').default('TDEV'),
  tags: text('tags').array().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Announcements ──
export const announcements = pgTable('announcements', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  linkText: text('link_text'),
  linkUrl: text('link_url'),
  active: boolean('active').default(true).notNull(),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Page Views (Analytics) ──
export const pageViews = pgTable('page_views', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  page: text('page').notNull(),
  visitorId: text('visitor_id'),
  sessionDuration: integer('session_duration').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Site Settings ──
export const siteSettings = pgTable('site_settings', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  key: text('key').notNull(),
  value: jsonb('value').default({}).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
