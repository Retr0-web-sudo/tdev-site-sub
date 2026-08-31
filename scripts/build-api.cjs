/**
 * Build script for the Vercel API serverless function.
 * Uses esbuild's JavaScript API to bundle the Express app.
 */
const esbuild = require('esbuild');

async function build() {
  try {
    await esbuild.build({
      entryPoints: ['scripts/api-entry.ts'],
      outfile: 'api/compiled.js',
      platform: 'node',
      bundle: true,
      packages: 'external',
      format: 'esm',
    });
    console.log('✅ API function compiled successfully');
  } catch (err) {
    console.error('❌ API build failed:', err);
    process.exit(1);
  }
}

build();
