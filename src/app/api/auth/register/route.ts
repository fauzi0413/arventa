import { NextRequest } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { registerSchema } from "@/lib/validations/auth.schema";

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
      return ApiResponse.error({
        message: "Validasi data registrasi gagal",
        error: parseResult.error.flatten().fieldErrors,
        statusCode: 400,
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
        statusCode: 400,
      });
    }

    let supabaseAuthId: string | null = null;

    // 1. Register user in Supabase Auth
    if (supabaseServiceRoleKey) {
      const supabaseAdmin = createSupabaseAdmin(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

      if (authError) {
        return ApiResponse.error({
          message: `Gagal membuat akun autentikasi: ${authError.message}`,
          statusCode: 400,
        });
      }
      supabaseAuthId = authData.user?.id || null;
    }

    // 2. Create user record in Prisma DB
    const newUser = await prisma.user.create({
      data: {
        email,
        fullName,
        phoneNumber: phoneNumber || null,
        role,
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

    return ApiResponse.success({
      message: "Registrasi akun berhasil. Silakan login ke sistem.",
      data: newUser,
      statusCode: 201,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/register:", error);
    return ApiResponse.error({
      message: "Terjadi kesalahan pada server saat registrasi",
      error: error?.message || error,
      statusCode: 500,
    });
  }
}
