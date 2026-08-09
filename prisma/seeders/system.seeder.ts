import { prisma } from "../../src/lib/prisma";
import { User } from "../../generated/prisma/client";

/**
 * Seed System Settings and Audit Logs.
 */
export async function seedSystem(admin: User) {
  console.log("\n⚙️ Seeding System Settings & Audit Logs (Idempotent)...");

  // 1. System Settings
  const settingsData = [
    { key: "maintenance_mode", value: "false", description: "Global maintenance mode toggle" },
    { key: "default_currency", value: "IDR", description: "System currency code" },
    { key: "storage_provider", value: "SUPABASE", description: "Active storage integration" },
  ];

  for (const setting of settingsData) {
    const existing = await prisma.systemSetting.findUnique({ where: { key: setting.key } });
    if (!existing) {
      await prisma.systemSetting.create({ data: setting });
      console.log(`✅ Created System Setting: ${setting.key}`);
    }
  }

  // 2. Audit Log
  const existingLog = await prisma.auditLog.findFirst({
    where: { action: "INITIAL_SYSTEM_SEED" },
  });

  if (!existingLog) {
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "INITIAL_SYSTEM_SEED",
        entityName: "SystemSetting",
        details: { status: "Success", modulesSeeded: 8 },
        ipAddress: "127.0.0.1",
      },
    });
    console.log(`✅ Created Initial System Audit Log`);
  }
}
