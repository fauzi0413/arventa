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
        property: true,
        unitUser: true,
      },
    });

    const results = [];

    for (const u of units) {
      const cleanProp = (u.property?.name || 'prop')
        .toLowerCase()
        .replace(/^(kos|kost|kontrakan|apartemen|ruko|wisma|homestay|residence)\s+/i, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 16) || 'prop';

      const cleanNum = u.unitNumber
        .toLowerCase()
        .replace(/^(kamar|unit|pintu|ruang|room)\s+/i, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 16) || 'unit';

      const baseCandidate = `${cleanProp}.${cleanNum}`;
      let roomEmail = `${baseCandidate}@arventa.id`;

      // Check if user already exists for another unit
      let roomUser = await prisma.user.findUnique({
        where: { email: roomEmail },
      });

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
