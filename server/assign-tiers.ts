import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
  console.log('🎨 Assigning tiers to products...');

  // Luxe: distinctive, statement pieces
  await sql.query(`
    UPDATE products SET tier = 'luxe' WHERE name ILIKE '%capsule%' OR name ILIKE '%designer%' OR name ILIKE '%premium%' OR name ILIKE '%statement%'
  `, []);

  // Premium: mid-range curated items
  await sql.query(`
    UPDATE products SET tier = 'premium' WHERE name ILIKE '%formal%' OR name ILIKE '%elegant%' OR name ILIKE '%silk%' OR name ILIKE '%leather%' OR name ILIKE '%blazer%' OR name ILIKE '%dress%'
  `, []);

  // Everything else = essentials
  // (already defaults to 'essentials')

  const counts = await sql.query(`
    SELECT tier, COUNT(*)::int as count FROM products GROUP BY tier ORDER BY tier
  `, []);
  
  console.log('\n📊 Final tier distribution:');
  for (const row of (counts as any[])) {
    console.log(`  ${row.tier}: ${row.count} items`);
  }

  // Show sample items per tier
  for (const tier of ['essentials', 'premium', 'luxe']) {
    const items = await sql.query(`SELECT name, price, tier FROM products WHERE tier = $1 LIMIT 5`, [tier]);
    console.log(`\n  ${tier.toUpperCase()} samples:`);
    for (const item of (items as any[])) {
      console.log(`    - ${item.name} (GH¢${item.price})`);
    }
  }

  console.log('\n✅ Tier assignment complete!');
  process.exit(0);
}

seed().catch(err => { console.error('Failed:', err); process.exit(1); });
