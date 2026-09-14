import { prisma } from "../src/lib/prisma";
import { ReportService } from "../src/services/report.service";

async function test() {
  console.log("--- TEST REPORT FINANCIAL ---");
  const result = await ReportService.getFinancialReport(null, {
    startDate: "2026-08-31",
    endDate: "2026-09-29",
  });

  console.log("SUMMARY:", JSON.stringify(result.summary, null, 2));
  console.log("PROPERTY BREAKDOWN:", JSON.stringify(result.propertyBreakdown, null, 2));
  console.log("MONTHLY TREND:", JSON.stringify(result.monthlyTrend, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
