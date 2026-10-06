// =============================================================================
//  global-setup.ts — provisioning database test (dijalankan SEKALI sebelum
//  seluruh test file, di proses terpisah — lihat vitest.config.ts `globalSetup`)
// =============================================================================
// Integration test di sini SENGAJA memakai Postgres nyata (bukan mock Prisma),
// tapi harus ISOLATED dari database dev (`master_bn`) supaya tidak pernah
// menyentuh/merusak data development. Maka:
//   1. Buat database `master_bn_test` terpisah (kalau belum ada).
//   2. Jalankan migration Prisma module `master` ke database itu.
// `src/master/src/database/index.ts` & `src/master/prisma.config.ts` sudah
// diarahkan untuk otomatis memakai `master_bn_test` saat NODE_ENV === 'test'
// (Vitest men-set NODE_ENV=test secara default).

import 'dotenv/config';
import { Client } from 'pg';
import { execSync } from 'node:child_process';

const DB_URL = process.env.DB_URL ?? 'postgresql://postgres:postgres@localhost:5432';
const TEST_DB_NAME = 'master_bn_test';

async function ensureDatabaseExists() {
  const admin = new Client({ connectionString: `${DB_URL}/postgres` });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB_NAME]);
    if (rowCount === 0) {
      // Nama database dikontrol konstanta di atas (bukan input user), aman
      // diselipkan langsung — identifier tidak bisa diparameterisasi di SQL.
      await admin.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
      console.log(`[global-setup] Database "${TEST_DB_NAME}" dibuat.`);
    }
  } finally {
    await admin.end();
  }
}

function runMigrations() {
  execSync('npx prisma migrate deploy --config=src/master/prisma.config.ts', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test', DB_URL },
  });
}

export async function setup() {
  await ensureDatabaseExists();
  runMigrations();
}
