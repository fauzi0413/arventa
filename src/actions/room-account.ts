"use server";

import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { UserRole, UnitStatus, LeaseStatus, RentalPeriodType } from "@/generated/prisma/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Generate a clean room email slug from unit number.
 * Example: "Kamar 101" -> "kamar101@arventa.id", "Apt 12B-01" -> "apt12b01@arventa.id"
 */
function generateRoomEmail(unitNumber: string, propertyName?: string, propertyId?: string): string {
  const cleanNumber = unitNumber.toLowerCase().replace(/[^a-z0-9]/g, "") || "unit";
  const cleanProp = propertyName?.toLowerCase().replace(/[^a-z0-9]/g, "") || (propertyId ? `p${propertyId.slice(0, 6)}` : "");
  return cleanProp ? `${cleanNumber}.${cleanProp}@arventa.id` : `${cleanNumber}@arventa.id`;
}

/**
 * Helper to generate a random strong password for room accounts
 */
function generateRandomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let password = "Arv!";
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export interface CreateUnitWithAccountInput {
  propertyId: string;
  unitNumber: string;
  floor?: number;
  basePrice: number;
  transitPrice?: number;
  allowedPeriod?: RentalPeriodType;
  capacity?: number;
  facilities?: string[];
}

/**
 * 1. Create Unit with dedicated Room-Based Account
 */
export async function createUnitWithAccount(input: CreateUnitWithAccountInput) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
      select: { id: true, name: true },
    });

    let roomEmail = generateRoomEmail(input.unitNumber, property?.name, input.propertyId);
    const roomPassword = generateRandomPassword();
    const fullName = `Akun Kamar (${input.unitNumber})`;

    // Check if user already exists
    let existingUser = await prisma.user.findUnique({
      where: { email: roomEmail },
      include: { unitAccount: true },
    });

    // If already assigned to another unit, append random suffix
    if (existingUser && existingUser.unitAccount) {
      const extraRand = Math.random().toString(36).substring(2, 6);
      const cleanNum = input.unitNumber.toLowerCase().replace(/[^a-z0-9]/g, "") || "unit";
      const cleanProp = property?.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || input.propertyId.slice(0, 6);
      roomEmail = `${cleanNum}.${cleanProp}.${extraRand}@arventa.id`;
      existingUser = await prisma.user.findUnique({
        where: { email: roomEmail },
        include: { unitAccount: true },
      });
    }

    // Check if Supabase Auth user already exists or create new
    let supabaseAuthId: string | null = null;
    if (supabaseAdmin) {
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = listData?.users?.find((u) => u.email === roomEmail);

        if (existingAuthUser) {
          supabaseAuthId = existingAuthUser.id;
          await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
            password: roomPassword,
            email_confirm: true,
          });
        } else {
          const { data: createData, error } = await supabaseAdmin.auth.admin.createUser({
            email: roomEmail,
            password: roomPassword,
            email_confirm: true,
            user_metadata: { full_name: fullName, role: UserRole.TENANT },
          });

          if (!error && createData?.user) {
            supabaseAuthId = createData.user.id;
          }
        }
      } catch (authErr) {
        console.warn("Supabase Auth sync warning in createUnitWithAccount:", authErr);
      }
    }

    // Create or find public User record for the room account
    let roomUser = existingUser;
    if (!roomUser) {
      roomUser = await prisma.user.create({
        data: {
          email: roomEmail,
          fullName,
          role: UserRole.TENANT,
          phoneNumber: "0812" + Math.floor(10000000 + Math.random() * 90000000),
          isActive: true,
          supabaseAuthId,
        },
        include: { unitAccount: true },
      });
    } else if (roomUser.role !== UserRole.TENANT) {
      roomUser = await prisma.user.update({
        where: { id: roomUser.id },
        data: { role: UserRole.TENANT },
        include: { unitAccount: true },
      });
    }

    // Upsert UserCredential for direct password login
    await prisma.userCredential.upsert({
      where: { userId: roomUser.id },
      update: { rawPassword: roomPassword },
      create: { userId: roomUser.id, rawPassword: roomPassword },
    });

    // Create the Unit linked to the room User account
    const unit = await prisma.unit.create({
      data: {
        propertyId: input.propertyId,
        unitNumber: input.unitNumber,
        floor: input.floor || 1,
        status: UnitStatus.AVAILABLE,
        allowedPeriod: input.allowedPeriod || RentalPeriodType.MONTHLY,
        basePrice: input.basePrice,
        transitPrice: input.transitPrice,
        capacity: input.capacity || 1,
        facilities: input.facilities || [],
        unitUserId: roomUser.id,
        roomPassword,
        roomPasswordLastReset: new Date(),
      },
      include: {
        unitUser: true,
        property: true,
      },
    });

    return {
      success: true,
      data: unit,
      credentials: {
        email: roomEmail,
        password: roomPassword,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create unit with room account",
    };
  }
}

/**
 * 2. Reset password of a room account (e.g. upon check-out or relocation)
 */
export async function resetRoomPassword(unitId: string) {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { unitUser: true },
    });

    if (!unit || !unit.unitUser) {
      throw new Error("Unit or associated room account not found");
    }

    const newPassword = generateRandomPassword();

    // Update Unit record
    await prisma.unit.update({
      where: { id: unitId },
      data: {
        roomPassword: newPassword,
        roomPasswordLastReset: new Date(),
      },
    });

    // Upsert UserCredential
    await prisma.userCredential.upsert({
      where: { userId: unit.unitUser.id },
      update: { rawPassword: newPassword },
      create: { userId: unit.unitUser.id, rawPassword: newPassword },
    });

    if (unit.unitUser.supabaseAuthId && supabaseAdmin) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(
          unit.unitUser.supabaseAuthId,
          { password: newPassword, email_confirm: true }
        );
      } catch (authErr) {
        console.warn("Supabase Auth sync warning in resetRoomPassword:", authErr);
      }
    }

    return {
      success: true,
      message: `Password for ${unit.unitNumber} reset successfully`,
      newPassword,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to reset room password",
    };
  }
}

/**
 * 3. Relocate Tenant from sourceUnitId to targetUnitId
 */
export async function relocateTenant({
  tenantProfileId,
  sourceUnitId,
  targetUnitId,
}: {
  tenantProfileId: string;
  sourceUnitId: string;
  targetUnitId: string;
}) {
  try {
    // Check source & target units
    const [sourceUnit, targetUnit] = await Promise.all([
      prisma.unit.findUnique({ where: { id: sourceUnitId } }),
      prisma.unit.findUnique({ where: { id: targetUnitId } }),
    ]);

    if (!sourceUnit || !targetUnit) {
      throw new Error("Source or target unit not found");
    }

    if (targetUnit.status === UnitStatus.OCCUPIED) {
      throw new Error(`Target unit ${targetUnit.unitNumber} is already OCCUPIED`);
    }

    // Find active lease on source unit
    const activeLease = await prisma.lease.findFirst({
      where: {
        unitId: sourceUnitId,
        tenantId: tenantProfileId,
        status: LeaseStatus.ACTIVE,
      },
    });

    if (!activeLease) {
      throw new Error("No active lease found for this tenant on source unit");
    }

    // Perform relocation in transaction
    await prisma.$transaction([
      // Transfer lease to target unit
      prisma.lease.update({
        where: { id: activeLease.id },
        data: { unitId: targetUnitId },
      }),
      // Set source unit status to CLEANING
      prisma.unit.update({
        where: { id: sourceUnitId },
        data: { status: UnitStatus.CLEANING },
      }),
      // Set target unit status to OCCUPIED
      prisma.unit.update({
        where: { id: targetUnitId },
        data: { status: UnitStatus.OCCUPIED },
      }),
    ]);

    // Reset password for source unit (so old tenant can no longer access source unit)
    await resetRoomPassword(sourceUnitId);

    // Generate new password for target unit for the relocating tenant
    const targetPasswordResult = await resetRoomPassword(targetUnitId);

    return {
      success: true,
      message: `Tenant successfully relocated from ${sourceUnit.unitNumber} to ${targetUnit.unitNumber}`,
      targetUnitPassword: targetPasswordResult.newPassword,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to relocate tenant",
    };
  }
}

/**
 * 4. Check-Out Tenant: Terminate lease, set unit to CLEANING, reset room password
 */
export async function checkoutTenant(leaseId: string) {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: { unit: true },
    });

    if (!lease) {
      throw new Error("Lease contract not found");
    }

    // Update lease and unit status
    await prisma.$transaction([
      prisma.lease.update({
        where: { id: leaseId },
        data: { status: LeaseStatus.TERMINATED },
      }),
      prisma.unit.update({
        where: { id: lease.unitId },
        data: { status: UnitStatus.CLEANING },
      }),
    ]);

    // Reset room password
    await resetRoomPassword(lease.unitId);

    return {
      success: true,
      message: `Check-out completed for ${lease.unit.unitNumber}. Unit status set to CLEANING and room password reset.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to checkout tenant",
    };
  }
}
