import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/auth/jwt";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * POST /api/auth/forgot-password
 * Send password reset email link using Resend API & JWT reset token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return ApiResponse.badRequest("Email wajib diisi");
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user in Prisma DB
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });

    if (!user) {
      return ApiResponse.notFound(`Akun dengan email '${cleanEmail}' tidak ditemukan.`);
    }

    // Generate password reset JWT token (valid for 60 minutes)
    const resetToken = signJwt(
      { userId: user.id, email: user.email, role: user.role, type: "reset" },
      60 * 60
    );

    const origin = request.nextUrl.origin || "http://localhost:3001";
    const resetLink = `${origin}/reset-password?token=${resetToken}`;

    // Send reset email via Resend API
    await sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetLink,
    });

    return ApiResponse.success({
      message: `Tautan atur ulang password telah dikirim ke email ${user.email}. Silakan periksa inbox/spam email Anda.`,
      data: {
        email: user.email,
        resetLink,
      },
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memproses permintaan atur ulang password.",
      error,
    });
  }
}
