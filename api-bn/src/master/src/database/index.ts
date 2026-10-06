import { PrismaClient } from './generated/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
export * from './generated/index.js';

// Test run terisolasi dari dev DB — lihat test/setup/global-setup.ts.
const dbName = process.env.NODE_ENV === 'test' ? 'master_bn_test' : 'master_bn';

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DB_URL + '/' + dbName }),
});
