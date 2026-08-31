import { z } from 'zod';

// ── Auth ──
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Messages ──
export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(500),
  message: z.string().min(1, 'Message is required'),
});

export const messageReplySchema = z.object({
  adminReply: z.string().min(1, 'Reply is required'),
});

// ── Products ──
export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().nullable(),
  price: z.string().or(z.number()).default('0'),
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
  status: z.string().optional().default('published'),
  published: z.boolean().optional().default(true),
  isVisible: z.boolean().optional().default(true),
});

// ── Categories ──
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  displayOrder: z.number().int().optional().default(0),
});

// ── Orders ──
export const orderSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional().default('pending'),
  total: z.string().or(z.number()).default('0'),
  shippingAddress: z.any().optional(),
  items: z.array(z.any()).optional().default([]),
});

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
});

// ── Custom Design Requests ──
export const designRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional().nullable(),
  shirtColor: z.string().optional().default('white'),
  shirtSize: z.string().optional().default('M'),
  designImageUrl: z.string().optional().nullable(),
  designData: z.any().optional(),
  notes: z.string().optional().nullable(),
  quantity: z.number().int().min(1).optional().default(1),
});

// ── Blog Posts ──
export const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(1, 'Content is required'),
  coverImage: z.string().optional().nullable(),
  published: z.boolean().optional().default(false),
  authorName: z.string().optional().default('TDEV'),
  tags: z.array(z.string()).optional().default([]),
});

// ── Announcements ──
export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  linkText: z.string().optional().nullable(),
  linkUrl: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

// ── Discount Codes ──
export const discountCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  discountPercent: z.number().int().min(1).max(100).default(10),
  gameName: z.string().min(1, 'Game name is required'),
  expiresAt: z.string().optional(),
});

// ── Page Views ──
export const pageViewSchema = z.object({
  page: z.string().min(1, 'Page is required'),
  visitorId: z.string().optional().nullable(),
  sessionDuration: z.number().int().optional().default(0),
});

// ── Site Settings ──
export const siteSettingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.any(),
});

// ── Newsletter ──
export const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});
