import { prisma } from "../../src/lib/prisma";
import {
  Property,
  UnitStatus,
  RentalPeriodType,
} from "../../generated/prisma/client";

interface SeedUnitsProps {
  kosGrahaAsri: Property;
  aptGatewayPasteur: Property;
}

/**
 * Seed units and unit inventories for properties.
 * Idempotent: Checks unitNumber per property and item names per unit before creation.
 */
export async function seedUnits({ kosGrahaAsri, aptGatewayPasteur }: SeedUnitsProps) {
  console.log("\n🚪 Seeding Units & Inventories (Idempotent)...");

  // Unit Kos 101
  let unitKos101 = await prisma.unit.findFirst({
    where: { propertyId: kosGrahaAsri.id, unitNumber: "Kamar 101" },
  });
  if (!unitKos101) {
    unitKos101 = await prisma.unit.create({
      data: {
        propertyId: kosGrahaAsri.id,
        unitNumber: "Kamar 101",
        floor: 1,
        status: UnitStatus.OCCUPIED,
        allowedPeriod: RentalPeriodType.MONTHLY,
        basePrice: 1500000,
        capacity: 1,
        facilities: ["AC", "WiFi", "Kamar Mandi Dalam", "Kasur Springbed", "Lemari Pakaian"],
      },
    });
    console.log(`✅ Created Unit: ${unitKos101.unitNumber}`);
  } else {
    console.log(`ℹ️ Existing Unit found: ${unitKos101.unitNumber}`);
  }

  // Unit Kos 102
  let unitKos102 = await prisma.unit.findFirst({
    where: { propertyId: kosGrahaAsri.id, unitNumber: "Kamar 102" },
  });
  if (!unitKos102) {
    unitKos102 = await prisma.unit.create({
      data: {
        propertyId: kosGrahaAsri.id,
        unitNumber: "Kamar 102",
        floor: 1,
        status: UnitStatus.AVAILABLE,
        allowedPeriod: RentalPeriodType.MONTHLY,
        basePrice: 1500000,
        capacity: 1,
        facilities: ["AC", "WiFi", "Kamar Mandi Dalam", "Kasur Springbed", "Lemari Pakaian"],
      },
    });
    console.log(`✅ Created Unit: ${unitKos102.unitNumber}`);
  } else {
    console.log(`ℹ️ Existing Unit found: ${unitKos102.unitNumber}`);
  }

  // Unit Apt 12B-01
  let unitApt12B01 = await prisma.unit.findFirst({
    where: { propertyId: aptGatewayPasteur.id, unitNumber: "Apt 12B-01" },
  });
  if (!unitApt12B01) {
    unitApt12B01 = await prisma.unit.create({
      data: {
        propertyId: aptGatewayPasteur.id,
        unitNumber: "Apt 12B-01",
        floor: 12,
        status: UnitStatus.OCCUPIED,
        allowedPeriod: RentalPeriodType.HOURLY,
        basePrice: 4500000,
        transitPrice: 250000,
        capacity: 2,
        facilities: ["AC LG 1PK", "Smart TV 32 inch", "Kitchenette", "Water Heater", "WiFi"],
      },
    });
    console.log(`✅ Created Unit: ${unitApt12B01.unitNumber}`);
  } else {
    console.log(`ℹ️ Existing Unit found: ${unitApt12B01.unitNumber}`);
  }

  // Unit Apt 12B-02
  let unitApt12B02 = await prisma.unit.findFirst({
    where: { propertyId: aptGatewayPasteur.id, unitNumber: "Apt 12B-02" },
  });
  if (!unitApt12B02) {
    unitApt12B02 = await prisma.unit.create({
      data: {
        propertyId: aptGatewayPasteur.id,
        unitNumber: "Apt 12B-02",
        floor: 12,
        status: UnitStatus.CLEANING,
        allowedPeriod: RentalPeriodType.MONTHLY,
        basePrice: 4000000,
        capacity: 2,
        facilities: ["AC LG 1PK", "Smart TV 32 inch", "Balkon Kota", "WiFi"],
      },
    });
    console.log(`✅ Created Unit: ${unitApt12B02.unitNumber}`);
  } else {
    console.log(`ℹ️ Existing Unit found: ${unitApt12B02.unitNumber}`);
  }

  // Seed Unit Inventories (Check before creation)
  const allUnits = [unitKos101, unitKos102, unitApt12B01, unitApt12B02];
  const defaultFurniture = [
    { itemName: "Kasur Springbed", quantity: 1, condition: "Baik", notes: "Ukuran Single/Queen nyaman" },
    { itemName: "AC LG 1PK", quantity: 1, condition: "Baik", notes: "Dingin & hening" },
    { itemName: "Smart TV 32 inch", quantity: 1, condition: "Baik", notes: "Terhubung Wi-Fi & Netflix" },
    { itemName: "Lemari Pakaian", quantity: 1, condition: "Baik", notes: "2 pintu dengan cermin" },
  ];

  for (const unit of allUnits) {
    for (const item of defaultFurniture) {
      const existingInventory = await prisma.unitInventory.findFirst({
        where: { unitId: unit.id, itemName: item.itemName },
      });
      if (!existingInventory) {
        await prisma.unitInventory.create({
          data: {
            unitId: unit.id,
            ...item,
          },
        });
      }
    }
    console.log(`✅ Inventory checked & ensured for ${unit.unitNumber}`);
  }

  return {
    unitKos101,
    unitKos102,
    unitApt12B01,
    unitApt12B02,
  };
}
