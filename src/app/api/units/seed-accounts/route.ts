import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/client";

/**
 * GET /api/units/seed-accounts
 * Auto-generates and links dedicated User accounts (role: TENANT) for all existing units in PostgreSQL DB
 */
export async function GET(request: NextRequest) {
  try {
    const units = await prisma.unit.findMany({
      include: {
        unitUser: true,
      },
    });

    const results = [];

    for (const u of units) {
      const cleanNum = u.unitNumber.toLowerCase().replace(/[^a-z0-9]/g, '') || `u${Date.now()}`;
      const roomEmail = `${cleanNum}@arventa.id`;

      let roomUser = await prisma.user.findUnique({
        where: { email: roomEmail },
      });

      if (!roomUser) {
        roomUser = await prisma.user.create({
          data: {
            fullName: `Akun Unit ${u.unitNumber}`,
            email: roomEmail,
            role: UserRole.TENANT,
            phoneNumber: '0812' + Math.floor(10000000 + Math.random() * 90000000),
            isActive: true,
          },
        });
      } else if (roomUser.role !== UserRole.TENANT) {
        roomUser = await prisma.user.update({
          where: { id: roomUser.id },
          data: { role: UserRole.TENANT },
        });
      }

      const updatedUnit = await prisma.unit.update({
        where: { id: u.id },
        data: {
          unitUserId: roomUser.id,
          roomPassword: u.roomPassword || 'Arv!789210',
          roomPasswordLastReset: u.roomPasswordLastReset || new Date(),
        },
        include: {
          unitUser: true,
        },
      });

      results.push({
        unitNumber: updatedUnit.unitNumber,
        email: roomUser.email,
        unitUserId: roomUser.id,
        role: roomUser.role,
        roomPassword: updatedUnit.roomPassword,
      });
    }

    return ApiResponse.success({
      message: "Dedicated tenant user accounts generated and linked for all units",
      data: results,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to seed unit accounts",
      error,
    });
  }
}
