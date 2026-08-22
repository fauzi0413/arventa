import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const flags = await prisma.featureFlag.findMany();
    const map: Record<string, boolean> = {
      ocr_ktp_enabled: true,
      room_account_enabled: true,
      resident_forum_enabled: true,
    };
    for (const f of flags) {
      map[f.key] = f.isEnabled;
    }
    return ApiResponse.success({
      message: 'Berhasil mengambil feature flags',
      data: map,
    });
  } catch (error) {
    console.error('GET /api/feature-flags error:', error);
    return ApiResponse.success({
      message: 'Fallback default feature flags',
      data: {
        ocr_ktp_enabled: true,
        room_account_enabled: true,
        resident_forum_enabled: true,
      },
    });
  }
}
