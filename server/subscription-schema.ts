import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Subscription Enums ──
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'paused', 'cancelled', 'expired']);
export const orderStatusEnum = pgEnum('subscription_order_status', ['pending', 'preparing', 'shipped', 'delivered', 'returned']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'succeeded', 'failed', 'refunded']);

// ── Subscription Plans ──
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).default('0').notNull(),
  interval: text('interval').default('monthly').notNull(),
  features: jsonb('features').default([]).notNull(),
  itemCountMin: integer('item_count_min').default(1),
  itemCountMax: integer('item_count_max').default(3),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Style Quizzes ──
export const styleQuizzes = pgTable('style_quizzes', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id').notNull(),
  sizes: jsonb('sizes').default({}).notNull(),
  preferredColors: text('preferred_colors').array().default([]),
  preferredStyles: text('preferred_styles').array().default([]),
  occasions: text('occasions').array().default([]),
  notes: text('notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Subscriptions ──
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id').notNull(),
  planId: uuid('plan_id').notNull(),
  status: subscriptionStatusEnum('status').default('active').notNull(),
  shippingAddress: jsonb('shipping_address').default({}),
  stylePreferences: jsonb('style_preferences').default({}),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  nextBillingDate: timestamp('next_billing_date', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Subscription Orders ──
export const subscriptionOrders = pgTable('subscription_orders', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  subscriptionId: uuid('subscription_id').notNull(),
  userId: uuid('user_id').notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  items: jsonb('items').default([]).notNull(),
  trackingNumber: text('tracking_number'),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  returnedAt: timestamp('returned_at', { withTimezone: true }),
  returnItems: jsonb('return_items').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Subscription Payments ──
export const subscriptionPayments = pgTable('subscription_payments', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  subscriptionId: uuid('subscription_id').notNull(),
  userId: uuid('user_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).default('0').notNull(),
  currency: text('currency').default('GHS').notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  paymentMethod: text('payment_method'),
  transactionId: text('transaction_id'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
