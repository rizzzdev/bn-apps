import { PrismaClient } from './generated/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
export * from './generated/client/index.js';
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DB_URL + '/internship_bn' }),
});
