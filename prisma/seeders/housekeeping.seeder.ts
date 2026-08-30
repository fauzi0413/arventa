import { prisma } from "../../src/lib/prisma";
import {
  User,
  Property,
  Unit,
  UnitStatus,
  MaintenanceType,
  MaintenanceStatus,
  ReportPriority,
  CostLiability,
} from "../../generated/prisma/client";

interface SeedHousekeepingProps {
  housekeeping: User;
  kosGrahaAsri: Property;
  aptGatewayPasteur: Property;
  unitKos101: Unit;
  unitKos102: Unit;
}

/**
 * Seed Housekeeping Property Assignments, Status Logs, and Maintenance Tickets.
 */
export async function seedHousekeeping({
  housekeeping,
  kosGrahaAsri,
  aptGatewayPasteur,
  unitKos101,
  unitKos102,
}: SeedHousekeepingProps) {
  console.log("\n🧹 Seeding Housekeeping Assignments, Logs & Maintenance Tickets (Idempotent)...");

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

  // 3. Seed Maintenance & Housekeeping Tickets
  // 3a. Ticket 1: Housekeeping Completed Task
  let hkTicket = await prisma.maintenanceTicket.findUnique({
    where: { ticketNumber: "HK-2026-001" },
  });

  if (!hkTicket) {
    hkTicket = await prisma.maintenanceTicket.create({
      data: {
        ticketNumber: "HK-2026-001",
        propertyId: kosGrahaAsri.id,
        unitId: unitKos102.id,
        type: MaintenanceType.HOUSEKEEPING,
        serviceType: "DEEP_CLEAN",
        title: "Deep Cleaning Kamar Mandi & Disinfeksi Unit 102",
        description: "Pembersihan kerak kamar mandi, penggantian sprei kasur baru, dan pel lantai menyeluruh sebelum penghuni baru check-in.",
        priority: ReportPriority.MEDIUM,
        status: MaintenanceStatus.RESOLVED,
        reportedByName: "SOP Rutin Check-in",
        reportedByRole: "STAFF",
        assignedStaffId: housekeeping.id,
        assignedStaffName: housekeeping.fullName,
        costLiability: CostLiability.OWNER,
        actualCost: 50000,
        photosBefore: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400"],
        photosAfter: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=400"],
        resolutionNotes: "Kamar telah bersih dan wangi. Siap untuk check-in.",
        checklist: {
          bathroom: true,
          bedLinen: true,
          floorSweptMopped: true,
          trashEmptied: true,
        },
        ratingScore: 5,
        ratingFeedback: "Sangat bersih, rapi, dan wangi sesuai standar SOP.",
        ratedAt: new Date(),
        ratedByName: "Owner Hendra",
        resolvedAt: new Date(),
        timelines: {
          create: [
            {
              status: "REPORTED",
              performerName: "Sistem ARVENTA",
              performerRole: "SYSTEM",
              notes: "Jadwal pembersihan deep cleaning otomatis dibuat menjelang check-in.",
            },
            {
              status: "IN_PROGRESS",
              performerName: housekeeping.fullName,
              performerRole: "Housekeeper",
              notes: "Housekeeper mulai membersihkan kamar mandi dan lantai.",
            },
            {
              status: "RESOLVED",
              performerName: housekeeping.fullName,
              performerRole: "Housekeeper",
              notes: "Checklist SOP kebersihan terpenuhi 100%. Kamar siap huni.",
            },
          ],
        },
      },
    });
    console.log(`✅ Created Maintenance Ticket: ${hkTicket.ticketNumber} [HOUSEKEEPING]`);
  }

  // 3b. Ticket 2: AC Repair Maintenance Task (In Progress)
  let mntTicket = await prisma.maintenanceTicket.findUnique({
    where: { ticketNumber: "MNT-2026-001" },
  });

  if (!mntTicket) {
    mntTicket = await prisma.maintenanceTicket.create({
      data: {
        ticketNumber: "MNT-2026-001",
        propertyId: kosGrahaAsri.id,
        unitId: unitKos101.id,
        type: MaintenanceType.REPAIR,
        serviceType: "AC_REPAIR",
        title: "AC Kamar 101 Kurang Dingin & Meneteskan Air",
        description: "Penghuni kamar 101 melaporkan AC mengeluarkan hembusan angin yang tidak dingin dan terdapat tetesan air di pipa indoor.",
        priority: ReportPriority.HIGH,
        status: MaintenanceStatus.IN_PROGRESS,
        reportedByName: "Siti Rahmawati (Penghuni)",
        reportedByRole: "TENANT",
        assignedStaffId: housekeeping.id,
        assignedStaffName: housekeeping.fullName,
        costLiability: CostLiability.OWNER,
        estimatedCost: 150000,
        damageAnalysis: "Filter AC kotor dan pipa pembuangan air kondensasi tersumbat lumut. Perlu cuci AC dan servis pipa.",
        vendorName: "Teknisi AC Sejahtera",
        photosBefore: ["https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&q=80&w=400"],
        timelines: {
          create: [
            {
              status: "REPORTED",
              performerName: "Siti Rahmawati",
              performerRole: "TENANT",
              notes: "Laporan komplain kerusakan AC diajukan via portal kamar penghuni.",
            },
            {
              status: "IN_PROGRESS",
              performerName: "Owner Hendra",
              performerRole: "OWNER",
              notes: "Owner menyetujui jadwal servis teknisi AC dan menugaskan staf untuk pendampingan.",
            },
          ],
        },
      },
    });
    console.log(`✅ Created Maintenance Ticket: ${mntTicket.ticketNumber} [REPAIR]`);
  }
}
