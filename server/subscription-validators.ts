import { z } from 'zod';

// ── Subscription Plans ──
export const subscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().nullable(),
  price: z.string().or(z.number()).default('0'),
  interval: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  features: z.array(z.string()).optional().default([]),
  itemCountMin: z.number().int().optional().default(1),
  itemCountMax: z.number().int().optional().default(3),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

// ── Create Subscription ──
export const createSubscriptionSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  shippingAddress: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

// ── Update Subscription ──
export const updateSubscriptionSchema = z.object({
  status: z.enum(['active', 'paused', 'cancelled']).optional(),
  planId: z.string().uuid().optional(),
  shippingAddress: z.any().optional(),
});

// ── Style Quiz ──
export const styleQuizSchema = z.object({
  sizes: z.object({
    top: z.string().optional(),
    bottom: z.string().optional(),
    dress: z.string().optional(),
    shoe: z.string().optional(),
  }).optional(),
  preferredColors: z.array(z.string()).optional().default([]),
  preferredStyles: z.array(z.string()).optional().default([]),
  occasions: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
});

// ── Ship Order (Admin) ──
export const shipOrderSchema = z.object({
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  notes: z.string().optional(),
});
