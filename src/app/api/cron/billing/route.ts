import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Vercel Cron — Billing Reminder (H-7)
// ---------------------------------------------------------------------------
// This route is triggered by Vercel Cron to send billing reminders
// 7 days before the due date.
//
// Configure in vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/billing",
//     "schedule": "0 8 * * *"
//   }]
// }
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // TODO: Implement billing reminder logic
    // 1. Query invoices with due_date = today + 7 days
    // 2. Get tenant contact info
    // 3. Send reminder via email (Resend) or WhatsApp
    // 4. Log the notification

    return NextResponse.json({
      success: true,
      message: "Billing reminders processed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON/BILLING] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
