import 'dotenv/config';
import { seedRolesAndMenus } from '../prisma/seeders/roles-menus.seeder';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log("=== RUNNING SEED ROLES AND MENUS ===");
  await seedRolesAndMenus();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
