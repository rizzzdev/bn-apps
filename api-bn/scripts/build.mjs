/**
 * esbuild production build script
 *
 * Strategy:
 * 1. Compile Prisma database .ts files individually (file-by-file) to dist/
 * 2. Copy existing Prisma.js runtime files to dist/
 * 3. Bundle main app into dist/bundle.js with database imports set as external
 * 4. Copy other Prisma generated assets
 */

import * as esbuild from 'esbuild';
import { readFileSync, copyFileSync, mkdirSync, existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname, resolve, relative, sep } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

// ─── Path aliases (mirrors tsconfig.json paths) ──────────────────────────────
const alias = {
  '@auth/index.js':       './src/auth/index.ts',
  '@app/index.js':        './src/app/index.ts',
  '@master/index.js':     './src/master/index.ts',
  '@academic/index.js':   './src/academic/index.ts',
  '@internship/index.js': './src/internship/index.ts',
  '@learn/index.js':      './src/learn/index.ts',
  '@exam/index.js':       './src/exam/index.ts',
  '@auth':                './src/auth/src',
  '@app':                 './src/app',
  '@master':              './src/master/src',
  '@academic':            './src/academic/src',
  '@internship':          './src/internship/src',
  '@learn':               './src/learn',
  '@exam':                './src/exam/src',
  '@':                    './src/learn',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function walkDir(dir, predicate) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(full, predicate));
    else if (predicate(entry.name)) files.push(full);
  }
  return files;
}

const nrm = (p) => p.replace(/\\/g, '/');

// ─── Step 1: Compile Prisma database .ts files ───────────────────────────────
async function compileDatabaseFiles() {
  console.log('[build] Compiling Prisma database .ts files...');

  const dbDirs = [
    'src/auth/src/database',
    'src/master/src/database',
    'src/academic/src/database',
    'src/internship/src/database',
    'src/learn/database',
  ].map((d) => join(ROOT, d));

  const tsFiles = dbDirs.flatMap((dir) =>
    walkDir(dir, (name) => name.endsWith('.ts') && !name.endsWith('.d.ts'))
  );

  if (tsFiles.length === 0) {
    console.warn('[build] No database .ts files found');
    return;
  }

  await esbuild.build({
    entryPoints: tsFiles,
    outdir: DIST,
    outbase: SRC,
    bundle: false,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    logLevel: 'warning',
  });

  console.log(`[build] Compiled ${tsFiles.length} database .ts files`);
}

// ─── Step 2.5: Fix .ts extensions in compiled output ─────────────────────
function fixTsExtensions() {
  console.log('[build] Fixing .ts → .js extensions in compiled output...');

  const jsFiles = walkDir(DIST, (name) => name.endsWith('.js') && !name.endsWith('.map.js'));
  let fixed = 0;
  for (const file of jsFiles) {
    const content = readFileSync(file, 'utf-8');
    // Replace from '...\.ts' → from '...\.js'
    const updated = content.replace(/(from\s+['"])([^'"]+)\.ts(['"])/g, '$1$2.js$3');
    if (updated !== content) {
      writeFileSync(file, updated, 'utf-8');
      fixed++;
    }
  }
  console.log(`[build] Fixed ${fixed} files`);
}

function copyJsRuntimeFiles() {
  console.log('[build] Copying Prisma .js runtime files...');

  const runtimeDirs = [
    'src/auth/src/database/generated/runtime',
    'src/master/src/database/generated/runtime',
    'src/academic/src/database/generated/runtime',
    'src/internship/src/database/generated',
    'src/learn/database/generated/runtime',
  ];

  let count = 0;
  for (const dir of runtimeDirs) {
    const srcDir = join(ROOT, dir);
    if (!existsSync(srcDir)) continue;

    const jsFiles = walkDir(srcDir, (name) => name.endsWith('.js') || name.endsWith('.mjs') || name.endsWith('.cjs'));
    for (const file of jsFiles) {
      const dest = file.replace(nrm(SRC), nrm(DIST));
      const destDir = dirname(dest);
      mkdirSync(destDir, { recursive: true });
      copyFileSync(file, dest);
      count++;
    }
  }
  console.log(`[build] Copied ${count} .js runtime files`);
}

// ─── Step 3: Bundle main app ─────────────────────────────────────────────────
async function bundleApp() {
  console.log('[build] Bundling main app...');

  // Known alias prefixes (sorted longest-first for correct matching)
  const aliasPrefixes = ['@auth', '@app', '@master', '@academic', '@internship', '@learn', '@exam', '@/'];

  const prismaPlugin = {
    name: 'prisma-external',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        // --- Determine if this is a local/alias path or a package ---
        if (!args.path.startsWith('.')) {
          // Not a relative path — check if it's a known alias or a package
          const isAlias = aliasPrefixes.some((p) => args.path.startsWith(p));
          if (!isAlias) return; // Package import (e.g. @prisma/...), skip
        }

        // Resolve the full path (resolve() correctly handles '.' segments)
        const resolved = resolve(args.resolveDir, args.path);
        const normalized = nrm(resolved);

        // Check if this import is inside any database directory
        const dbPatterns = [
          '/auth/src/database/',
          '/master/src/database/',
          '/academic/src/database/',
          '/internship/src/database/',
          '/learn/database/',
        ];

        const isDbFile = dbPatterns.some((p) => normalized.includes('/src' + p) || normalized.includes('/database/generated/'));

        if (isDbFile) {
          // Calculate path relative to outbase (src/) to match compiled output location
          const relativeToSrc = nrm(relative(SRC, resolved));
          const jsPath = relativeToSrc.replace(/\.ts$/, '.js');
          return { path: './' + jsPath, external: true };
        }

        return undefined;
      });
    },
  };

  await esbuild.build({
    entryPoints: [join(ROOT, 'src/index.ts')],
    bundle: true,
    outfile: join(DIST, 'bundle.js'),
    platform: 'node',
    format: 'esm',
    target: 'node20',
    sourcemap: 'external',
    alias,
    packages: 'external',
    plugins: [prismaPlugin],
    logLevel: 'info',
  });

  console.log('[build] App bundle complete.');
}

// ─── Step 4: Copy remaining Prisma generated assets ───────────────────────────
function copyPrismaAssets() {
  console.log('[build] Copying remaining Prisma assets...');

  const srcPairs = [
    { src: 'src/auth/src/database/generated',   dst: 'dist/auth/src/database/generated' },
    { src: 'src/master/src/database/generated', dst: 'dist/master/src/database/generated' },
    { src: 'src/academic/src/database/generated', dst: 'dist/academic/src/database/generated' },
    { src: 'src/internship/src/database/generated', dst: 'dist/internship/src/database/generated' },
    { src: 'src/learn/database/generated',        dst: 'dist/learn/database/generated' },
  ];

  let count = 0;
  for (const { src, dst } of srcPairs) {
    const srcDir = join(ROOT, src);
    if (!existsSync(srcDir)) {
      console.warn(`[copy] Source not found: ${srcDir}`);
      continue;
    }

    const files = walkDir(srcDir, () => true);
    for (const file of files) {
      const rel = nrm(relative(srcDir, file));
      const dest = join(ROOT, dst, rel);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(file, dest);
      count++;
    }
    console.log(`[copy] ${src} → ${dst} (${files.length} files)`);
  }
  console.log(`[build] Copied ${count} asset files`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const start = Date.now();

  mkdirSync(DIST, { recursive: true });

  await compileDatabaseFiles();
  copyJsRuntimeFiles();
  fixTsExtensions();
  await bundleApp();
  copyPrismaAssets();

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  const bundleSize = existsSync(join(DIST, 'bundle.js'))
    ? (statSync(join(DIST, 'bundle.js')).size / 1024 / 1024).toFixed(1) + 'mb'
    : 'N/A';

  console.log(`\n✅ Build finished in ${elapsed}s`);
  console.log(`   Bundle: dist/bundle.js (${bundleSize})`);
}

main().catch((err) => {
  console.error('[build] Failed:', err);
  process.exit(1);
});
