import { NextRequest, NextResponse } from "next/server";
import { BillingCronService } from "@/services/billing-cron.service";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

/**
 * Vercel Cron — Daily Billing Automation Route (GET)
 * Checks active leases, auto-generates H-7 invoices, updates overdue statuses & sends email notifications.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, enforce CRON_SECRET authorization header
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
    }
  }

  try {
    const results = await BillingCronService.processDailyBilling();

    return NextResponse.json({
      success: true,
      message: "Daily billing automation processed successfully",
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON/BILLING] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Manual Trigger Route (POST)
 * Allows authenticated Owners/Admins to trigger billing automation on demand.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const results = await BillingCronService.processDailyBilling();

    return NextResponse.json({
      success: true,
      message: "Manual billing process executed successfully",
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON/BILLING/MANUAL] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
