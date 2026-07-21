import { prisma } from '../src/database/index.js';

async function main() {

  console.log('Starting role migration...');
  
  const users = await prisma.sentri_users.findMany();
  let updatedCount = 0;

  for (const user of users) {
    try {
      let roles: string[] = JSON.parse(user.roles);
      if (roles.includes('admin')) {
        roles = roles.map(role => role === 'admin' ? 'super_admin' : role);
        
        await prisma.sentri_users.update({
          where: { id: user.id },
          data: { roles: JSON.stringify(roles) }
        });
        
        updatedCount++;
        console.log(`Updated user ${user.id} to super_admin`);
      }
    } catch (e) {
      console.error(`Failed to parse roles for user ${user.id}:`, e);
    }
  }

  console.log(`Migration completed. Updated ${updatedCount} users.`);
  await prisma.$disconnect();
}

main().catch(console.error);
