import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/lib/api-response";

// ---------------------------------------------------------------------------
// POST /api/auth/logout — Clear user auth session
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    return ApiResponse.success({
      message: "Berhasil keluar dari sistem",
    });
  } catch (error: any) {
    console.error("Error in /api/auth/logout:", error);
    return ApiResponse.error({
      message: "Gagal memproses logout",
      error: error?.message || error,
      statusCode: 500,
    });
  }
}
