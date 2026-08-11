import { NextResponse } from "next/server";
import { isMaintenanceModeActive } from "@/lib/settings";
import { ApiResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const isMaintenance = await isMaintenanceModeActive();

    const response = ApiResponse.success({
      message: isMaintenance ? "Maintenance mode is ACTIVE" : "System is ONLINE",
      data: {
        isMaintenance,
      },
    });

    // Update browser cookie for proxy.ts Edge runtime alignment
    response.cookies.set("maintenance_mode", isMaintenance ? "true" : "false", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal mengecek status maintenance",
      error,
      status: 500,
    });
  }
}
