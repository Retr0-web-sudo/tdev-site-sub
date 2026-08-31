/**
 * Seed script: Reads the TDEV catalog CSV and inserts products into Neon
 * Categorizes into: Homme (male), Femme (female), Global (unisex)
 * 
 * Run: node node_modules/esbuild/bin/esbuild server/seed.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/seed.js && node dist/seed.js
 */

import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

const sql = neon(DATABASE_URL);
const uuidv4 = randomUUID;

interface CsvRow {
  name: string;
  slug: string;
  sku: string;
  brand: string;
  material: string;
  weight: string;
  price: string;
  compare_at_price: string;
  stock_quantity: string;
  in_stock: string;
  featured: string;
  category: string;
  sizes: string;
  colors: string;
  tags: string;
  images: string;
  videos: string;
  description: string;
}

// ── Categorization Logic ──
function categorize(name: string): 'Homme' | 'Femme' | 'Global' {
  const lower = name.toLowerCase();
  if (lower.includes('boi') || lower.includes('boy')) return 'Homme';
  if (lower.includes('girly') || lower.includes('girl')) return 'Femme';
  return 'Global';
}

// Clean slugs for uniqueness + URL safety
function cleanSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'product';
}

async function seed() {
  console.log('🚀 Starting product seed...');

  // Read CSV
  const csvPath = path.resolve(__dirname, '..', 'TDEV Full Catelogue 2026.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  // Parse CSV
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',');
    const row: any = {};
    headers.forEach((h, idx) => { row[h] = (vals[idx] || '').trim(); });
    rows.push(row as CsvRow);
  }

  // Deduplicate by slug
  const unique = new Map<string, CsvRow>();
  for (const row of rows) {
    if (row.name && !unique.has(row.slug)) {
      unique.set(row.slug, row);
    }
  }

  const products = Array.from(unique.values());
  console.log(`📦 ${products.length} unique products to seed`);

  // Create categories
  const categories = ['Homme', 'Femme', 'Global'];
  const categoryIds: Record<string, string> = {};

  for (const cat of categories) {
    const existing = await sql.query('SELECT id FROM categories WHERE slug = $1 LIMIT 1', [cat.toLowerCase()]);
    if (existing.length > 0) {
      categoryIds[cat] = existing[0].id;
      console.log(`✅ Category "${cat}" already exists (id: ${existing[0].id})`);
    } else {
      const id = uuidv4();
      await sql.query(
        `INSERT INTO categories (id, name, slug, description, created_at, updated_at) VALUES ($1, $2, $3, $4, now(), now())`,
        [id, cat, cat.toLowerCase(), `${cat} collection by TDEV | TENUE DE VILLE`]
      );
      categoryIds[cat] = id;
      console.log(`✅ Created category "${cat}" (id: ${id})`);
    }
  }

  // Insert products
  let inserted = 0;
  let skipped = 0;

  for (const product of products) {
    const cat = categorize(product.name);
    const catId = categoryIds[cat];
    const slug = cleanSlug(product.slug);
    const sizes = (product.sizes || '').split('|').map(s => s.trim()).filter(Boolean);
    const colors = (product.colors || '').split('|').map(c => c.trim()).filter(Boolean);
    const tags = ['tdev', cat.toLowerCase(), ...(product.tags || '').split('|').map(t => t.trim()).filter(Boolean)];
    const desc = product.description || `${product.name} | TENUE DE VILLE`;
    const price = product.price || '30';

    // Check if already exists
    const existing = await sql.query('SELECT id FROM products WHERE slug = $1 LIMIT 1', [slug]);
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const id = uuidv4();

    // Convert arrays to PostgreSQL format: {val1,val2}
    const pgArr = (arr: string[]) => arr.length ? `{${arr.join(',')}}` : '{}';

    try {
      await sql.query(
        `INSERT INTO products (id, name, slug, description, price, category_id, images, sizes, colors, 
         in_stock, featured, sku, stock_quantity, brand, material, tags, status, published, is_visible, 
         published_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, now(), now())`,
        [
          id, product.name, slug, desc, price, catId,
          pgArr([]), pgArr(sizes), pgArr(colors),
          true, false, product.sku || slug, parseInt(product.stock_quantity || '100') || 100,
          product.brand || 'TDEV | TENUE DE VILLE', product.material || '100% Cotton',
          pgArr(tags), 'published', true, true, new Date().toISOString()
        ]
      );
      inserted++;
      if (inserted % 5 === 0) process.stdout.write('.');
    } catch (err: any) {
      console.error(`\n❌ Error inserting "${product.name}": ${err.message}`);
    }
  }

  console.log(`\n\n✅ Done! ${inserted} products inserted, ${skipped} already existed.`);
  console.log(`📊 Femme: ${products.filter(p => categorize(p.name) === 'Femme').length} designs`);
  console.log(`📊 Homme: ${products.filter(p => categorize(p.name) === 'Homme').length} designs`);
  console.log(`📊 Global: ${products.filter(p => categorize(p.name) === 'Global').length} designs`);
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
