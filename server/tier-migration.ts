/**
 * Add tier column to products + reseed with tier assignments
 * Run: bunx tsx server/tier-migration.ts
 */
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('🚀 Adding tier column to products...');

  // Add tier column
  await sql.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'essentials'`, []);
  console.log('✅ tier column added');

  // Create index
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_products_tier ON products(tier)`, []);
  console.log('✅ tier index created');

  // Assign tiers based on price and category
  await sql.query(`
    UPDATE products SET tier = 'luxe' 
    WHERE CAST(price AS numeric) >= 80 OR material ILIKE '%designer%' OR material ILIKE '%premium%'
  `, []);
  await sql.query(`
    UPDATE products SET tier = 'premium' 
    WHERE CAST(price AS numeric) >= 45 AND tier = 'essentials'
  `, []);

  // Verify
  const counts = await sql.query(`
    SELECT tier, COUNT(*)::int as count 
    FROM products 
    GROUP BY tier 
    ORDER BY tier
  `, []);
  console.log('\n📊 Tier distribution:');
  for (const row of counts) {
    console.log(`  ${row.tier}: ${row.count} items`);
  }

  console.log('\n✅ Tier migration complete!');
  process.exit(0);
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
