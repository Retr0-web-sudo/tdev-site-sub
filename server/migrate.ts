/**
 * Database Migration Script
 * Run: npx tsx server/migrate.ts
 * This creates all tables from the Lovable backup schema on Neon.
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Create a .env file with your Neon connection string.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log('🚀 Starting migration to Neon...');

  // Create enum types
  await sql.query(`
    DO $$ BEGIN
      CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `, []);
  console.log('✅ Enum types created');

  // Create has_role function
  await sql.query(`
    CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
    RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
      SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = _user_id AND role = _role
      );
    $$;
  `, []);
  console.log('✅ has_role function created');

  // Create tables
  const queries = [
    // Profiles
    `CREATE TABLE IF NOT EXISTS public.profiles (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid NOT NULL,
      display_name text,
      avatar_url text,
      email text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
    // User Roles
    `CREATE TABLE IF NOT EXISTS public.user_roles (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid NOT NULL,
      role public.app_role NOT NULL,
      PRIMARY KEY (id)
    )`,
    // Categories
    `CREATE TABLE IF NOT EXISTS public.categories (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      slug text NOT NULL,
      description text,
      image_url text,
      display_order integer DEFAULT 0,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
    // Products
    `CREATE TABLE IF NOT EXISTS public.products (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      slug text NOT NULL,
      description text,
      price numeric(10,2) DEFAULT 0 NOT NULL,
      compare_at_price numeric(10,2),
      category_id uuid,
      images text[] DEFAULT '{}',
      sizes text[] DEFAULT '{}',
      colors text[] DEFAULT '{}',
      in_stock boolean DEFAULT true,
      featured boolean DEFAULT false,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      shopify_product_id text,
      shopify_synced_at timestamp with time zone,
      sku text,
      stock_quantity integer DEFAULT 0 NOT NULL,
      weight numeric,
      material text,
      brand text,
      tags text[] DEFAULT '{}',
      videos text[] DEFAULT '{}' NOT NULL,
      status text DEFAULT 'published',
      published boolean DEFAULT true,
      is_visible boolean DEFAULT true,
      published_at timestamp with time zone DEFAULT now(),
      PRIMARY KEY (id)
    )`,
    // Orders
    `CREATE TABLE IF NOT EXISTS public.orders (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid,
      status text DEFAULT 'pending' NOT NULL,
      total numeric(10,2) DEFAULT 0 NOT NULL,
      shipping_address jsonb,
      items jsonb DEFAULT '[]' NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['pending', 'processing', 'shipped', 'delivered', 'cancelled']))
    )`,
    // Messages
    `CREATE TABLE IF NOT EXISTS public.messages (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      email text NOT NULL,
      subject text NOT NULL,
      message text NOT NULL,
      status text DEFAULT 'unread' NOT NULL,
      admin_reply text,
      replied_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
    // Custom Design Requests
    `CREATE TABLE IF NOT EXISTS public.custom_design_requests (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      email text NOT NULL,
      phone text,
      shirt_color text DEFAULT 'white' NOT NULL,
      shirt_size text DEFAULT 'M' NOT NULL,
      design_image_url text,
      design_data jsonb DEFAULT '{}',
      notes text,
      quantity integer DEFAULT 1 NOT NULL,
      status text DEFAULT 'pending' NOT NULL,
      admin_notes text,
      quoted_price numeric,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
    // Blog Posts
    `CREATE TABLE IF NOT EXISTS public.blog_posts (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      title text NOT NULL,
      slug text NOT NULL,
      excerpt text,
      content text NOT NULL,
      cover_image text,
      published boolean DEFAULT false NOT NULL,
      author_name text DEFAULT 'TDEV',
      tags text[] DEFAULT '{}',
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
    // Announcements
    `CREATE TABLE IF NOT EXISTS public.announcements (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      link_text text,
      link_url text,
      active boolean DEFAULT true NOT NULL,
      display_order integer DEFAULT 0,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
    // Discount Codes
    `CREATE TABLE IF NOT EXISTS public.discount_codes (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      code text NOT NULL,
      discount_percent integer DEFAULT 10 NOT NULL,
      game_name text NOT NULL,
      used boolean DEFAULT false NOT NULL,
      used_at timestamp with time zone,
      expires_at timestamp with time zone DEFAULT (now() + interval '7 days') NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
    // Page Views
    `CREATE TABLE IF NOT EXISTS public.page_views (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      page text NOT NULL,
      visitor_id text,
      session_duration integer DEFAULT 0,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
    // Site Settings
    `CREATE TABLE IF NOT EXISTS public.site_settings (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      key text NOT NULL,
      value jsonb DEFAULT '{}' NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (id)
    )`,
  ];

  for (const query of queries) {
    try {
      await sql.query(query, []);
      console.log(`✅ ${query.match(/CREATE TABLE IF NOT EXISTS public\.(\w+)/)?.[1] || 'table'}`);
    } catch (err) {
      console.error(`❌ Error creating table:`, err);
    }
  }

  // Add foreign key constraint for products.category_id
  try {
    await sql.query(`
      ALTER TABLE public.products
        ADD CONSTRAINT products_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES public.categories(id)
        ON DELETE SET NULL;
    `, []);
    console.log('✅ Foreign key constraint added: products.category_id → categories.id');
  } catch (err) {
    console.error('❌ Error adding foreign key constraint:', err);
  }

  console.log('\n✅ Migration complete! All tables created in Neon.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
