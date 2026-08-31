/**
 * Add wishlist, notifications, monthly_boxes tables
 * Run: bunx tsx server/add-tables.ts
 */
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('🚀 Creating wishlist, notifications, monthly_boxes tables...');

  await sql.query(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      product_id UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      UNIQUE(user_id, product_id)
    )
  `, []);
  console.log('✅ wishlists');

  await sql.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      type TEXT DEFAULT 'info',
      title TEXT NOT NULL,
      message TEXT,
      data JSONB,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    )
  `, []);
  console.log('✅ notifications');

  await sql.query(`
    CREATE TABLE IF NOT EXISTS monthly_boxes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subscription_id UUID NOT NULL,
      user_id UUID NOT NULL,
      month TIMESTAMPTZ NOT NULL,
      items JSONB DEFAULT '[]',
      status TEXT DEFAULT 'building',
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    )
  `, []);
  console.log('✅ monthly_boxes');

  // Indexes
  await sql.query('CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id)', []);
  await sql.query('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read)', []);
  await sql.query('CREATE INDEX IF NOT EXISTS idx_monthly_boxes_user ON monthly_boxes(user_id, month)', []);
  console.log('✅ indexes');

  console.log('\n✅ Migration complete!');
  process.exit(0);
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
