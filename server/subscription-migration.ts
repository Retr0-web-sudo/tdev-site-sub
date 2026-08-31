/**
 * Subscription Migration Script
 * Run: npx tsx server/subscription-migration.ts
 * Creates subscription tables on Neon.
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log('🚀 Starting subscription migration...');

  // Create enum types
  const enums = [
    `DO $$ BEGIN
      CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;`,
    `DO $$ BEGIN
      CREATE TYPE public.subscription_order_status AS ENUM ('pending', 'preparing', 'shipped', 'delivered', 'returned');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;`,
    `DO $$ BEGIN
      CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;`,
  ];

  for (const q of enums) {
    await sql.query(q, []);
  }
  console.log('✅ Enum types created');

  // Create tables
  const tables = [
    // Subscription Plans
    `CREATE TABLE IF NOT EXISTS public.subscription_plans (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      slug text NOT NULL,
      description text,
      price numeric(10,2) DEFAULT 0 NOT NULL,
      interval text DEFAULT 'monthly' NOT NULL,
      features jsonb DEFAULT '[]' NOT NULL,
      item_count_min integer DEFAULT 1,
      item_count_max integer DEFAULT 3,
      is_active boolean DEFAULT true,
      display_order integer DEFAULT 0,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT subscription_plans_slug_unique UNIQUE (slug)
    )`,
    // Style Quizzes
    `CREATE TABLE IF NOT EXISTS public.style_quizzes (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid NOT NULL,
      sizes jsonb DEFAULT '{}' NOT NULL,
      preferred_colors text[] DEFAULT '{}',
      preferred_styles text[] DEFAULT '{}',
      occasions text[] DEFAULT '{}',
      notes text,
      completed_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT style_quizzes_user_id_unique UNIQUE (user_id)
    )`,
    // Subscriptions
    `CREATE TABLE IF NOT EXISTS public.subscriptions (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid NOT NULL,
      plan_id uuid NOT NULL,
      status public.subscription_status DEFAULT 'active' NOT NULL,
      shipping_address jsonb DEFAULT '{}',
      style_preferences jsonb DEFAULT '{}',
      current_period_start timestamp with time zone,
      current_period_end timestamp with time zone,
      next_billing_date timestamp with time zone,
      cancelled_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
    // Subscription Orders
    `CREATE TABLE IF NOT EXISTS public.subscription_orders (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      subscription_id uuid NOT NULL,
      user_id uuid NOT NULL,
      status public.subscription_order_status DEFAULT 'pending' NOT NULL,
      items jsonb DEFAULT '[]' NOT NULL,
      tracking_number text,
      shipped_at timestamp with time zone,
      delivered_at timestamp with time zone,
      returned_at timestamp with time zone,
      return_items jsonb DEFAULT '[]',
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
    // Subscription Payments
    `CREATE TABLE IF NOT EXISTS public.subscription_payments (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      subscription_id uuid NOT NULL,
      user_id uuid NOT NULL,
      amount numeric(10,2) DEFAULT 0 NOT NULL,
      currency text DEFAULT 'GHS' NOT NULL,
      status public.payment_status DEFAULT 'pending' NOT NULL,
      payment_method text,
      transaction_id text,
      paid_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
  ];

  for (const q of tables) {
    try {
      await sql.query(q, []);
      const name = q.match(/CREATE TABLE IF NOT EXISTS public\.(\w+)/)?.[1] || 'table';
      console.log(`✅ ${name}`);
    } catch (err) {
      console.error(`❌ Error:`, err);
    }
  }

  // Add indexes
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id)`,
    `CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status)`,
    `CREATE INDEX IF NOT EXISTS idx_sub_orders_subscription_id ON public.subscription_orders(subscription_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sub_orders_user_id ON public.subscription_orders(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sub_orders_status ON public.subscription_orders(status)`,
    `CREATE INDEX IF NOT EXISTS idx_sub_payments_subscription_id ON public.subscription_payments(subscription_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sub_payments_user_id ON public.subscription_payments(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_style_quizzes_user_id ON public.style_quizzes(user_id)`,
  ];

  for (const q of indexes) {
    try {
      await sql.query(q, []);
    } catch (err) {
      console.error('❌ Index error:', err);
    }
  }
  console.log('✅ Indexes created');

  // Add foreign keys
  const fks = [
    `ALTER TABLE public.subscriptions
      ADD CONSTRAINT fk_subscriptions_plan_id
      FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
      ON DELETE RESTRICT`,
    `ALTER TABLE public.subscription_orders
      ADD CONSTRAINT fk_sub_orders_subscription_id
      FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
      ON DELETE CASCADE`,
    `ALTER TABLE public.subscription_orders
      ADD CONSTRAINT fk_sub_orders_user_id
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE`,
    `ALTER TABLE public.subscription_payments
      ADD CONSTRAINT fk_sub_payments_subscription_id
      FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
      ON DELETE CASCADE`,
    `ALTER TABLE public.subscription_payments
      ADD CONSTRAINT fk_sub_payments_user_id
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE`,
    `ALTER TABLE public.style_quizzes
      ADD CONSTRAINT fk_style_quizzes_user_id
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE`,
  ];

  for (const q of fks) {
    try {
      await sql.query(q, []);
    } catch (err: any) {
      if (!err.message?.includes('already exists')) {
        console.error('❌ FK error:', err.message);
      }
    }
  }
  console.log('✅ Foreign keys added');

  // Seed subscription plans
  const seedPlans = `
    INSERT INTO public.subscription_plans (name, slug, description, price, interval, features, item_count_min, item_count_max, display_order)
    VALUES
      ('Essentials', 'essentials', '2-3 curated clothing items per month. Free delivery, free returns, style quiz personalisation.', 149, 'monthly',
       '["2-3 curated items","Free delivery in Greater Accra","Free returns within 5 days","Style quiz personalisation","Cancel anytime"]',
       2, 3, 1),
      ('Premium', 'premium', '4-5 curated clothing items per month. Exclusive collections, priority stylist, free delivery.', 299, 'monthly',
       '["4-5 curated items","Access to exclusive collections","Priority stylist matching","Free delivery in Greater Accra","Free returns within 5 days","Cancel anytime"]',
       4, 5, 2),
      ('Luxe', 'luxe', '6-8 premium clothing items per month. Designer pieces, dedicated stylist, express delivery.', 499, 'monthly',
       '["6-8 premium items","Designer & limited-edition pieces","Dedicated personal stylist","Free express delivery","Free returns within 7 days","Early access to new collections","Cancel anytime"]',
       6, 8, 3)
    ON CONFLICT (slug) DO NOTHING;
  `;
  await sql.query(seedPlans, []);
  console.log('✅ Subscription plans seeded');

  console.log('\n✅ Subscription migration complete!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
