import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { seedUsers } from "./seeders/users.seeder";
import { seedProperties } from "./seeders/properties.seeder";
import { seedUnits } from "./seeders/units.seeder";
import { seedLeasesAndInvoices } from "./seeders/leases.seeder";
import { seedExpenses } from "./seeders/expenses.seeder";
import { seedMaintenanceTasks } from "./seeders/tasks.seeder";

/**
 * ARVENTA Property Management System - Safe Idempotent Database Seeder
 * Orchestrates domain-specific seeders in order WITHOUT deleting existing data.
 * Safe to run multiple times in production/development without creating duplicate records.
 */
async function main() {
  console.log("🌱 Starting ARVENTA Safe Database Seeding (Idempotent)...");

  // 1. Seed Users & Tenant Profiles
  const { ownerHendra, housekeepingBudi, tenantSiti, tenantRizky } =
    await seedUsers();

  // 2. Seed Properties
  const { kosGrahaAsri, aptGatewayPasteur } = await seedProperties(ownerHendra);

  // 3. Seed Units & Unit Inventories
  const { unitKos101, unitKos102, unitApt12B01, unitApt12B02 } =
    await seedUnits({ kosGrahaAsri, aptGatewayPasteur });

  // 4. Seed Leases & Invoices
  await seedLeasesAndInvoices({
    unitKos101,
    unitApt12B01,
    tenantSitiProfile: tenantSiti.tenantProfile!,
    tenantRizkyProfile: tenantRizky.tenantProfile!,
  });

  // 5. Seed Operational Expenses
  await seedExpenses({
    kosGrahaAsri,
    owner: ownerHendra,
  });

  // 6. Seed Maintenance Tasks (Housekeeping Board)
  await seedMaintenanceTasks({
    unitApt12B02,
    unitKos102,
    unitKos101,
    owner: ownerHendra,
    housekeeping: housekeepingBudi,
  });

  console.log("\n🎉 ARVENTA Safe Database Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
