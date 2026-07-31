import { PrismaClient } from './generated/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
export * from './generated/index.js';
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: (process.env.DB_URL || 'postgresql://postgres:nightwitch96@localhost:5433') + '/auth_bn' }),
});
