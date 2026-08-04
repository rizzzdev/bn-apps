import { PrismaClient } from './generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
export * from './generated/client.js';
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DB_URL + '/exam_bn' }),
});
