import { NextRequest } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { registerSchema } from "@/lib/validations/auth.schema";
import { signJwt } from "@/lib/auth/jwt";
import { sendVerificationEmail } from "@/lib/email";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        fieldErrors.confirmPassword?.[0] ||
        fieldErrors.password?.[0] ||
        fieldErrors.email?.[0] ||
        fieldErrors.fullName?.[0] ||
        "Validasi data registrasi gagal";

      return ApiResponse.error({
        message: firstErrorMessage,
        error: fieldErrors,
        status: 400,
      });
    }

    const { fullName, email, phoneNumber, role, password } = parseResult.data;

    // Check if email already exists in Prisma DB
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return ApiResponse.error({
        message: "Email sudah terdaftar. Silakan gunakan email lain atau login.",
        status: 400,
      });
    }

    let supabaseAuthId: string | null = null;

    // 1. Register user in Supabase Auth (email_confirm: false so Supabase sends verification email if configured)
    if (supabaseServiceRoleKey) {
      const supabaseAdmin = createSupabaseAdmin(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: false,
          user_metadata: { full_name: fullName },
        });

      if (authError && !authError.message.includes("already registered")) {
        return ApiResponse.error({
          message: `Gagal membuat akun autentikasi: ${authError.message}`,
          status: 400,
        });
      }
      supabaseAuthId = authData.user?.id || null;
    }

    // 2. Create user record in Prisma DB with isActive = false (requiring email verification)
    const newUser = await prisma.user.create({
      data: {
        email,
        fullName,
        phoneNumber: phoneNumber || null,
        role,
        isActive: false, // Must be verified via link before login
        supabaseAuthId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    // 3. Generate secure verification token (valid for 24 hours)
    const verificationToken = signJwt(
      { userId: newUser.id, email: newUser.email, role: newUser.role, type: "verify" },
      24 * 60 * 60
    );

    const origin = request.nextUrl.origin || "http://localhost:3001";
    const verificationLink = `${origin}/verify-email?token=${verificationToken}`;

    // 4. Send verification email via Resend API
    await sendVerificationEmail({
      to: newUser.email,
      fullName: newUser.fullName,
      verificationLink,
    });

    return ApiResponse.success({
      message: `Registrasi akun berhasil! Link verifikasi email telah dikirim. Silakan cek email ${email} Anda untuk memverifikasi akun sebelum login.`,
      data: {
        ...newUser,
        verificationLink,
      },
      status: 201,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/register:", error);
    return ApiResponse.error({
      message: "Terjadi kesalahan pada server saat registrasi",
      error: error?.message || error,
      status: 500,
    });
  }
}
