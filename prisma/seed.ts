import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { seedUsers } from "./seeders/users.seeder";
import { seedSaaS } from "./seeders/saas.seeder";
import { seedRolesAndMenus } from "./seeders/roles-menus.seeder";
import { seedProperties } from "./seeders/properties.seeder";
import { seedUnits } from "./seeders/units.seeder";
import { seedHousekeeping } from "./seeders/housekeeping.seeder";
import { seedLeasesAndInvoices } from "./seeders/leases.seeder";
import { seedExpenses } from "./seeders/expenses.seeder";
import { seedCommunity } from "./seeders/community.seeder";
import { seedSystem } from "./seeders/system.seeder";

/**
 * ARVENTA Property Management System - Full 8-Module Database Seeder
 * Orchestrates all domain seeders in sequential order without data loss.
 */
async function main() {
  console.log("🌱 Starting ARVENTA Full System Database Seeding (8 Modules)...");

  // 1. Users & Tenant Profiles
  const { admin, ownerHendra, housekeepingBudi, tenantSiti, tenantRizky } =
    await seedUsers();

  // 2. Roles, Permissions & Dynamic Menus
  await seedRolesAndMenus();

  // 3. SaaS Subscriptions & Billing
  await seedSaaS(ownerHendra);

  // 4. Properties
  const { kosGrahaAsri, aptGatewayPasteur } = await seedProperties(ownerHendra);

  // 5. Units & Room-Based Accounts
  const { unitKos101, unitKos102, unitApt12B01 } = await seedUnits({
    kosGrahaAsri,
    aptGatewayPasteur,
  });

  // 6. Housekeeping Property Assignments & Status Logs
  await seedHousekeeping({
    housekeeping: housekeepingBudi,
    kosGrahaAsri,
    aptGatewayPasteur,
    unitKos101,
    unitKos102,
  });

  // 7. Active Leases & Invoices
  await seedLeasesAndInvoices({
    unitKos101,
    unitApt12B01,
    tenantSitiProfile: tenantSiti.tenantProfile!,
    tenantRizkyProfile: tenantRizky.tenantProfile!,
  });

  // 8. Operational Expenses (OpEx)
  await seedExpenses({
    kosGrahaAsri,
    owner: ownerHendra,
  });

  // 9. Community Announcements & Resident Forum
  await seedCommunity({
    kosGrahaAsri,
    owner: ownerHendra,
    tenantSiti,
    tenantRizky,
  });

  // 10. System Settings & Audit Logs
  await seedSystem(admin);

  console.log("\n🎉 ARVENTA Full System Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
