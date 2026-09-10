import 'dotenv/config';

import { BillingCronService } from '../src/services/billing-cron.service';
import { prisma } from '../src/lib/prisma';

async function testBillingCron() {
  console.log("=== EXECUTING BILLING CRON SERVICE TEST ===");
  const results = await BillingCronService.processDailyBilling();
  console.log("Cron Execution Results:", JSON.stringify(results, null, 2));

  const logs = await prisma.auditLog.findMany({
    where: {
      action: { in: ["AUTO_OVERDUE_UPDATED", "AUTO_INVOICE_GENERATED", "CRON_AUTO_BILLING_PROCESSED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log("\nRecent Audit Logs Created:");
  logs.forEach(log => {
    console.log(`- [${log.action}] Entity: ${log.entityName} | Details:`, log.details);
  });
}

testBillingCron().catch(console.error).finally(() => prisma.$disconnect());
