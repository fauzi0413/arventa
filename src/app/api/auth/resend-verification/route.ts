import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/auth/jwt";
import { sendVerificationEmail } from "@/lib/email";

/**
 * POST /api/auth/resend-verification
 * Resend email verification link to user's registered email address.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return ApiResponse.badRequest("Email wajib diisi.");
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user in DB
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return ApiResponse.notFound(`Akun dengan email '${cleanEmail}' tidak ditemukan.`);
    }

    // 2. Check if already active
    if (user.isActive) {
      return ApiResponse.badRequest("Akun ini sudah terverifikasi dan aktif. Silakan langsung login.");
    }

    // 3. Generate new 24-hour verification token
    const verificationToken = signJwt(
      { userId: user.id, email: user.email, role: user.role, type: "verify" },
      24 * 60 * 60
    );

    const origin = request.nextUrl.origin || "http://localhost:3000";
    const verificationLink = `${origin}/verify-email?token=${verificationToken}`;

    // 4. Send verification email via Resend
    await sendVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      verificationLink,
    });

    return ApiResponse.success({
      message: `Link verifikasi email berhasil dikirim ulang ke ${user.email}. Silakan periksa inbox/spam email Anda.`,
      data: {
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/auth/resend-verification:", error);
    return ApiResponse.error({
      message: "Gagal mengirim ulang email verifikasi. Silakan coba beberapa saat lagi.",
      error: error?.message || error,
    });
  }
}
