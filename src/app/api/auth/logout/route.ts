import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST /api/auth/logout — Clear user auth session & demo cookies
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase auth signOut warning:", err);
    }

    const response = NextResponse.json({
      success: true,
      message: "Berhasil keluar dari sistem",
    });

    response.cookies.set("arventa_access_token", "", { path: "/", maxAge: 0 });
    response.cookies.set("arventa_refresh_token", "", { path: "/", maxAge: 0 });
    response.cookies.set("arventa_session", "", { path: "/", maxAge: 0 });
    response.cookies.set("arventa_demo_role", "", { path: "/", maxAge: 0 });
    response.cookies.set("arventa_user_email", "", { path: "/", maxAge: 0 });

    return response;
  } catch (error: any) {
    console.error("Error in /api/auth/logout:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses logout" },
      { status: 500 }
    );
  }
}
