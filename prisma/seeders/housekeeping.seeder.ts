import { prisma } from "../../src/lib/prisma";
import { User, Property, Unit, UnitStatus } from "../../generated/prisma/client";

interface SeedHousekeepingProps {
  housekeeping: User;
  kosGrahaAsri: Property;
  aptGatewayPasteur: Property;
  unitKos101: Unit;
  unitKos102: Unit;
}

/**
 * Seed Housekeeping Property Assignments & Unit Status Logs.
 */
export async function seedHousekeeping({
  housekeeping,
  kosGrahaAsri,
  aptGatewayPasteur,
  unitKos101,
  unitKos102,
}: SeedHousekeepingProps) {
  console.log("\n🧹 Seeding Housekeeping Assignments & Logs (Idempotent)...");

  // 1. Housekeeping Assignments
  const properties = [kosGrahaAsri, aptGatewayPasteur];
  for (const property of properties) {
    const existing = await prisma.housekeepingAssignment.findFirst({
      where: { userId: housekeeping.id, propertyId: property.id },
    });

    if (!existing) {
      await prisma.housekeepingAssignment.create({
        data: {
          userId: housekeeping.id,
          propertyId: property.id,
        },
      });
      console.log(`✅ Assigned Housekeeping ${housekeeping.fullName} -> Property ${property.name}`);
    } else {
      console.log(`ℹ️ Existing Assignment found: ${housekeeping.fullName} -> ${property.name}`);
    }
  }

  // 2. Unit Status Log
  const existingLog = await prisma.unitStatusLog.findFirst({
    where: { unitId: unitKos102.id, changedById: housekeeping.id },
  });

  if (!existingLog) {
    await prisma.unitStatusLog.create({
      data: {
        unitId: unitKos102.id,
        changedById: housekeeping.id,
        previousStatus: UnitStatus.CLEANING,
        newStatus: UnitStatus.AVAILABLE,
        notes: "Deep cleaning selesai, kamar siap huni.",
      },
    });
    console.log(`✅ Created Unit Status Log for ${unitKos102.unitNumber}`);
  } else {
    console.log(`ℹ️ Existing Unit Status Log found for ${unitKos102.unitNumber}`);
  }
}
