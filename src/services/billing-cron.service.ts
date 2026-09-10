import { prisma } from "@/lib/prisma";
import { InvoiceStatus, LeaseStatus } from "@/generated/prisma/client";
import { sendInvoicePaymentEmail, sendOverdueInvoiceEmail } from "@/lib/email";

export class BillingCronService {
  /**
   * Run daily automated billing process:
   * 1. Auto update Overdue status for past due invoices
   * 2. Auto generate Invoices H-7 before due date & send reminder emails
   */
  static async processDailyBilling() {
    const results = {
      overdueUpdatedCount: 0,
      invoicesGeneratedCount: 0,
      remindersSentCount: 0,
      errors: [] as string[],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ------------------------------------------------------------------------
    // STEP 1: Auto Update Overdue Invoices
    // ------------------------------------------------------------------------
    try {
      const overdueCandidates = await prisma.invoice.findMany({
        where: {
          status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PENDING_VERIFICATION] },
          dueDate: { lt: today },
        },
        include: {
          lease: {
            include: {
              unit: { include: { property: true } },
              tenant: { include: { user: true } },
            },
          },
        },
      });

      for (const inv of overdueCandidates) {
        // Penalty calculation (Default Rp 50.000 if not set)
        const currentPenalty = Number(inv.penaltyAmount || 0);
        const autoPenalty = currentPenalty > 0 ? currentPenalty : 50000;
        const newTotalAmount = Number(inv.amount) + Number(inv.utilityAmount) + autoPenalty;

        await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            status: InvoiceStatus.OVERDUE,
            penaltyAmount: autoPenalty,
            totalAmount: newTotalAmount,
          },
        });

        results.overdueUpdatedCount++;

        // Audit Log entry
        await prisma.auditLog.create({
          data: {
            action: "AUTO_OVERDUE_UPDATED",
            entityName: "Invoice",
            entityId: inv.id,
            details: {
              invoiceNumber: inv.invoiceNumber,
              oldStatus: inv.status,
              newStatus: InvoiceStatus.OVERDUE,
              penaltyAdded: autoPenalty,
              dueDate: inv.dueDate,
            },
          },
        });

        // Send Email Alert to Tenant
        const tenantEmail = inv.lease.tenant.email || inv.lease.tenant.user?.email;
        const tenantName = inv.lease.tenant.fullName || inv.lease.tenant.user?.fullName || "Penyewa";
        if (tenantEmail) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          await sendOverdueInvoiceEmail({
            to: tenantEmail,
            tenantName,
            invoiceNumber: inv.invoiceNumber,
            propertyName: inv.lease.unit.property.name,
            unitNumber: inv.lease.unit.unitNumber,
            totalAmount: `Rp ${newTotalAmount.toLocaleString("id-ID")}`,
            penaltyAmount: `Rp ${autoPenalty.toLocaleString("id-ID")}`,
            dueDate: new Date(inv.dueDate).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            portalUrl: `${appUrl}/portal/invoices`,
          }).catch((e) => console.error("Failed to send overdue email:", e));
        }
      }
    } catch (err: any) {
      console.error("[CRON_BILLING] Error updating overdue status:", err);
      results.errors.push(`Overdue error: ${err.message}`);
    }

    // ------------------------------------------------------------------------
    // STEP 2: Auto Generate Invoices (H-7) for Active Leases
    // ------------------------------------------------------------------------
    try {
      const activeLeases = await prisma.lease.findMany({
        where: {
          status: LeaseStatus.ACTIVE,
        },
        include: {
          unit: { include: { property: true } },
          tenant: { include: { user: true } },
          invoices: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      for (const lease of activeLeases) {
        const startDate = new Date(lease.startDate);
        const dayOfMonth = startDate.getDate();

        let targetDueDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
        if (targetDueDate < today) {
          targetDueDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
        }

        const diffMs = targetDueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // If target due date is within H-7 (0 <= diffDays <= 7)
        if (diffDays >= 0 && diffDays <= 7) {
          const startOfDueDay = new Date(targetDueDate);
          startOfDueDay.setHours(0, 0, 0, 0);
          const endOfDueDay = new Date(targetDueDate);
          endOfDueDay.setHours(23, 59, 59, 999);

          const existingInvoice = await prisma.invoice.findFirst({
            where: {
              leaseId: lease.id,
              dueDate: {
                gte: startOfDueDay,
                lte: endOfDueDay,
              },
            },
          });

          if (!existingInvoice) {
            const dateStr = targetDueDate.toISOString().slice(0, 10).replace(/-/g, "");
            const randStr = Math.random().toString(36).substring(2, 7).toUpperCase();
            const invoiceNumber = `INV-${dateStr}-${randStr}`;

            const rentPrice = Number(lease.rentPrice);
            const totalAmount = rentPrice;

            const newInvoice = await prisma.invoice.create({
              data: {
                invoiceNumber,
                leaseId: lease.id,
                amount: rentPrice,
                utilityAmount: 0,
                penaltyAmount: 0,
                totalAmount,
                dueDate: targetDueDate,
                status: InvoiceStatus.PENDING,
              },
            });

            results.invoicesGeneratedCount++;

            // Audit Log
            await prisma.auditLog.create({
              data: {
                action: "AUTO_INVOICE_GENERATED",
                entityName: "Invoice",
                entityId: newInvoice.id,
                details: {
                  invoiceNumber,
                  leaseId: lease.id,
                  tenantName: lease.tenant.fullName || lease.tenant.user?.fullName,
                  dueDate: targetDueDate,
                  totalAmount,
                },
              },
            });

            // Send H-7 Reminder Email
            const tenantEmail = lease.tenant.email || lease.tenant.user?.email;
            const tenantName = lease.tenant.fullName || lease.tenant.user?.fullName || "Penyewa";
            if (tenantEmail) {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
              const successEmail = await sendInvoicePaymentEmail({
                to: tenantEmail,
                tenantName,
                invoiceNumber,
                unitNumber: `${lease.unit.unitNumber} (${lease.unit.property.name})`,
                amount: `Rp ${totalAmount.toLocaleString("id-ID")}`,
                dueDate: targetDueDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
                paymentUrl: `${appUrl}/portal/invoices`,
              }).catch((e) => console.error("Failed to send reminder email:", e));

              if (successEmail) results.remindersSentCount++;
            }
          }
        }
      }
    } catch (err: any) {
      console.error("[CRON_BILLING] Error generating invoices:", err);
      results.errors.push(`Auto generate error: ${err.message}`);
    }

    // Overall Cron Execution Audit Log
    await prisma.auditLog.create({
      data: {
        action: "CRON_AUTO_BILLING_PROCESSED",
        entityName: "SystemCron",
        details: {
          timestamp: new Date(),
          ...results,
        },
      },
    });

    return results;
  }
}
