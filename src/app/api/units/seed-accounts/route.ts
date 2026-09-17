import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/client";

/**
 * GET /api/units/seed-accounts
 * Auto-generates, links, and provisions dedicated User accounts (role: TENANT) & credentials for all existing units in DB.
 * Handles property scoping to completely prevent unique constraint collisions on unit_user_id.
 */
export async function GET(request: NextRequest) {
  try {
    const units = await prisma.unit.findMany({
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        unitUser: {
          include: {
            userCredential: true,
          },
        },
      },
      orderBy: [{ propertyId: "asc" }, { unitNumber: "asc" }],
    });

    const results = [];
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    for (const u of units) {
      const cleanProp = u.property?.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || `p${u.propertyId.slice(0, 6)}`;
      const cleanNum = u.unitNumber.toLowerCase().replace(/[^a-z0-9]/g, "") || `u${Date.now()}`;
      const baseCandidate = `${cleanNum}.${cleanProp}`;
      let roomEmail = `${baseCandidate}@arventa.id`;

      // Check if user already exists for another unit
      let targetPassword = u.roomPassword;
      if (!targetPassword) {
        let rand = "";
        for (let i = 0; i < 6; i++) {
          rand += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        targetPassword = `Arv!${rand}`;
      }

      let roomUser = u.unitUser;

      if (roomUser) {
        // If this user is already linked to another unit, find sequential suffix
        const otherUnit = await prisma.unit.findFirst({
          where: { unitUserId: roomUser.id, NOT: { id: u.id } },
        });

        if (otherUnit) {
          let counter = 2;
          let isAvailable = false;
          while (!isAvailable && counter <= 100) {
            const testEmail = `${baseCandidate}${counter}@arventa.id`;
            const exists = await prisma.user.findUnique({ where: { email: testEmail } });
            if (!exists) {
              roomEmail = testEmail;
              roomUser = null;
              isAvailable = true;
            } else {
              counter++;
            }
          }
        }
      }

      if (!roomUser) {
        // Find existing user with default property-scoped email
        let existingUser = await prisma.user.findUnique({
          where: { email: roomEmail },
          include: { unitAccount: true },
        });

        // If email already taken by another unit's account, add unique random suffix
        if (existingUser && existingUser.unitAccount && existingUser.unitAccount.id !== u.id) {
          const extraRand = Math.random().toString(36).substring(2, 6);
          roomEmail = `${cleanNum}.${cleanProp}.${extraRand}@arventa.id`;
          existingUser = await prisma.user.findUnique({
            where: { email: roomEmail },
            include: { unitAccount: true },
          });
        }

        if (existingUser && (!existingUser.unitAccount || existingUser.unitAccount.id === u.id)) {
          roomUser = existingUser as any;
          if (roomUser && roomUser.role !== UserRole.TENANT) {
            roomUser = await prisma.user.update({
              where: { id: roomUser.id },
              data: { role: UserRole.TENANT, isActive: true },
            }) as any;
          }
        } else {
          roomUser = await prisma.user.create({
            data: {
              fullName: `Akun Unit ${u.unitNumber}`,
              email: roomEmail,
              role: UserRole.TENANT,
              phoneNumber: "0812" + Math.floor(10000000 + Math.random() * 90000000),
              isActive: true,
            },
          }) as any;
        }
      }

      // Upsert UserCredential
      if (roomUser) {
        await prisma.userCredential.upsert({
          where: { userId: roomUser.id },
          update: { rawPassword: targetPassword },
          create: { userId: roomUser.id, rawPassword: targetPassword },
        });
      }

      const updatedUnit = await prisma.unit.update({
        where: { id: u.id },
        data: {
          unitUserId: roomUser?.id,
          roomPassword: targetPassword,
          roomPasswordLastReset: u.roomPasswordLastReset || new Date(),
        },
        include: {
          unitUser: true,
          property: true,
        },
      });

      results.push({
        propertyName: updatedUnit.property.name,
        unitNumber: updatedUnit.unitNumber,
        email: updatedUnit.unitUser?.email,
        unitUserId: updatedUnit.unitUserId,
        role: updatedUnit.unitUser?.role,
        roomPassword: updatedUnit.roomPassword,
      });
    }

    return ApiResponse.success({
      message: `Successfully provisioned dedicated accounts and credentials for ${results.length} units`,
      data: results,
    });
  } catch (error) {
    console.error("Error in seed-accounts route:", error);
    return ApiResponse.error({
      message: "Failed to seed unit accounts",
      error,
    });
  }
}
