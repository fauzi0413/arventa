import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

/**
 * GET /api/admin/subscriptions
 * Fetch SaaS Subscription Tiers, Active Owner Subscriptions, Invoices, and MRR/ARR Statistics.
 */
export async function GET() {
  try {
    const [plansList, subscriptionsList, invoicesList] = await Promise.all([
      // 1. Fetch SaaS Subscription Plans (Tier Basic, Business, Pro)
      prisma.saaSPlan.findMany({
        orderBy: { priceMonthly: "asc" },
        include: {
          _count: {
            select: {
              subscriptions: true,
            },
          },
        },
      }),

      // 2. Fetch Active Owner Subscriptions
      prisma.ownerSubscription.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
          plan: true,
          saasInvoices: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),

      // 3. Fetch SaaS Invoices (Billing Transactions)
      prisma.saaSInvoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          subscription: {
            include: {
              owner: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
              plan: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Calculate MRR / ARR Statistics
    const paidInvoices = invoicesList.filter((inv: any) => inv.status === "PAID");
    const totalMRR = paidInvoices.reduce((acc: number, inv: any) => acc + Number(inv.amount), 0);
    const pendingInvoicesCount = invoicesList.filter((inv: any) => inv.status === "PENDING").length;

    // Fetch raw plan statuses directly from DB table to bypass stale Prisma Client SELECT cache
    let planStatuses: Record<string, string> = {};
    try {
      const rawStatusRows: any[] = await prisma.$queryRawUnsafe(`SELECT id, status FROM saas_plans`);
      for (const row of rawStatusRows) {
        if (row.id && row.status) {
          planStatuses[row.id] = row.status;
        }
      }
    } catch (e) {
      console.warn("Could not query raw plan statuses:", e);
    }

    const formattedPlans = plansList.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      maxProperties: plan.maxProperties,
      maxUnits: plan.maxUnits,
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: Number(plan.priceYearly),
      features: plan.features,
      status: planStatuses[plan.id] || plan.status || "ACTIVE",
      subscriberCount: plan._count.subscriptions,
      createdAt: plan.createdAt,
    }));

    const formattedSubscriptions = subscriptionsList.map((sub: any) => ({
      id: sub.id,
      ownerId: sub.ownerId,
      ownerName: sub.owner.fullName,
      ownerEmail: sub.owner.email,
      planId: sub.planId,
      planName: sub.plan.name,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      autoRenew: sub.autoRenew,
      latestInvoiceNumber: sub.saasInvoices[0]?.invoiceNumber || "-",
      latestInvoiceStatus: sub.saasInvoices[0]?.status || "-",
      createdAt: sub.createdAt,
    }));

    const formattedInvoices = invoicesList.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      subscriptionId: inv.subscriptionId,
      ownerName: inv.subscription.owner.fullName,
      ownerEmail: inv.subscription.owner.email,
      planName: inv.subscription.plan.name,
      amount: Number(inv.amount),
      status: inv.status,
      paymentProof: inv.paymentProof,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt,
      createdAt: inv.createdAt,
    }));

    return ApiResponse.success({
      message: "Berhasil mengambil data paket langganan & tagihan billing SaaS",
      data: {
        plans: formattedPlans,
        subscriptions: formattedSubscriptions,
        invoices: formattedInvoices,
        stats: {
          totalMRR,
          totalARR: totalMRR * 12,
          activeSubscriptionsCount: subscriptionsList.filter((s: any) => s.status === "ACTIVE").length,
          pendingInvoicesCount,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/subscriptions error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil data langganan & billing",
      error,
      status: 500,
    });
  }
}

/**
 * POST /api/admin/subscriptions
 * Handles: CREATE_PLAN, UPDATE_PLAN, VERIFY_INVOICE, ASSIGN_SUBSCRIPTION
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Create New SaaS Subscription Tier Plan
    if (action === "CREATE_PLAN") {
      const { name, maxProperties, maxUnits, priceMonthly, priceYearly, features } = body;

      if (!name || priceMonthly === undefined) {
        return ApiResponse.error({
          message: "Nama paket dan harga bulanan wajib diisi",
          status: 400,
        });
      }

      const existingPlan = await prisma.saaSPlan.findUnique({
        where: { name },
      });

      if (existingPlan) {
        return ApiResponse.error({
          message: `Paket SaaS dengan nama "${name}" sudah ada`,
          status: 400,
        });
      }

      const newPlan = await prisma.saaSPlan.create({
        data: {
          name,
          maxProperties: parseInt(maxProperties || "1", 10),
          maxUnits: parseInt(maxUnits || "10", 10),
          priceMonthly: parseFloat(priceMonthly),
          priceYearly: parseFloat(priceYearly || priceMonthly * 10),
          features: Array.isArray(features) ? features : [],
          status: body.status || "ACTIVE",
        },
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          action: "CREATE_SAAS_PLAN",
          entityName: "SaaSPlan",
          entityId: newPlan.id,
          details: { name, priceMonthly, maxProperties, maxUnits, status: newPlan.status },
          ipAddress: "127.0.0.1",
        },
      });

      return ApiResponse.success({
        message: `Paket langganan SaaS "${name}" berhasil dibuat`,
        data: newPlan,
      });
    }

    // 2. Update Existing SaaS Subscription Plan
    if (action === "UPDATE_PLAN") {
      const { planId, name, maxProperties, maxUnits, priceMonthly, priceYearly, features, status } = body;

      if (!planId && !name) {
        return ApiResponse.error({
          message: "planId atau nama paket wajib diisi",
          status: 400,
        });
      }

      // Find existing plan by ID or by Name
      const existingPlan = await prisma.saaSPlan.findFirst({
        where: {
          OR: [
            ...(planId ? [{ id: planId }] : []),
            ...(name ? [{ name }] : []),
          ],
        },
      });

      // Check if plan has active subscribers before deactivating
      if (status === "INACTIVE" && existingPlan) {
        const activeSubCount = await prisma.ownerSubscription.count({
          where: { planId: existingPlan.id },
        });
        if (activeSubCount > 0) {
          return ApiResponse.error({
            message: `Paket "${existingPlan.name}" sudah memiliki ${activeSubCount} subscriber aktif dan tidak dapat dinonaktifkan.`,
            status: 400,
          });
        }
      }

      const updateData: any = {
        name: name !== undefined ? name : undefined,
        maxProperties: maxProperties !== undefined ? parseInt(maxProperties, 10) : undefined,
        maxUnits: maxUnits !== undefined ? parseInt(maxUnits, 10) : undefined,
        priceMonthly: priceMonthly !== undefined ? parseFloat(priceMonthly) : undefined,
        priceYearly: priceYearly !== undefined ? parseFloat(priceYearly) : undefined,
        features: Array.isArray(features) ? features : undefined,
        status: status !== undefined ? status : undefined,
      };

      let updatedPlan: any;
      try {
        if (existingPlan) {
          updatedPlan = await prisma.saaSPlan.update({
            where: { id: existingPlan.id },
            data: updateData,
          });
        } else {
          updatedPlan = await prisma.saaSPlan.create({
            data: {
              name: name || "Paket SaaS Baru",
              maxProperties: parseInt(maxProperties || "1", 10),
              maxUnits: parseInt(maxUnits || "10", 10),
              priceMonthly: parseFloat(priceMonthly || "99000"),
              priceYearly: parseFloat(priceYearly || "990000"),
              features: Array.isArray(features) ? features : [],
              status: status || "ACTIVE",
            },
          });
        }
      } catch (err: any) {
        // Fallback for cached Prisma Client instance where status is unknown argument in runtime
        delete updateData.status;
        if (existingPlan) {
          updatedPlan = await prisma.saaSPlan.update({
            where: { id: existingPlan.id },
            data: updateData,
          });
          if (status) {
            try {
              await prisma.$executeRawUnsafe(
                `UPDATE saas_plans SET status = $1 WHERE id = $2`,
                status,
                existingPlan.id
              );
              updatedPlan.status = status;
            } catch (e) {
              console.warn("Failed raw status update:", e);
            }
          }
        } else {
          updatedPlan = await prisma.saaSPlan.create({
            data: {
              name: name || "Paket SaaS Baru",
              maxProperties: parseInt(maxProperties || "1", 10),
              maxUnits: parseInt(maxUnits || "10", 10),
              priceMonthly: parseFloat(priceMonthly || "99000"),
              priceYearly: parseFloat(priceYearly || "990000"),
              features: Array.isArray(features) ? features : [],
            },
          });
        }
      }

      // Ensure PostgreSQL status column is 100% updated directly
      if (status && updatedPlan?.id) {
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE saas_plans SET status = $1 WHERE id = $2`,
            status,
            updatedPlan.id
          );
          updatedPlan.status = status;
        } catch (e) {
          console.warn("Direct SQL status update error:", e);
        }
      }

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          action: "UPDATE_SAAS_PLAN",
          entityName: "SaaSPlan",
          entityId: updatedPlan.id,
          details: { name: updatedPlan.name, priceMonthly: Number(updatedPlan.priceMonthly), status: updatedPlan.status || status },
          ipAddress: "127.0.0.1",
        },
      });

      return ApiResponse.success({
        message: `Paket SaaS "${updatedPlan.name}" berhasil diperbarui`,
        data: updatedPlan,
      });
    }

    // 3. Verify / Approve / Reject SaaS Invoice Payment
    if (action === "VERIFY_INVOICE") {
      const { invoiceId, status } = body; // status = "PAID" | "CANCELLED"

      if (!invoiceId || !status) {
        return ApiResponse.error({
          message: "invoiceId dan status (PAID/CANCELLED) wajib diisi",
          status: 400,
        });
      }

      const invoice = await prisma.saaSInvoice.findUnique({
        where: { id: invoiceId },
        include: { subscription: true },
      });

      if (!invoice) {
        return ApiResponse.error({
          message: "Invoice tagihan tidak ditemukan",
          status: 404,
        });
      }

      const isPaid = status === "PAID";
      const paidAtDate = isPaid ? new Date() : null;

      // Update Invoice status
      const updatedInvoice = await prisma.saaSInvoice.update({
        where: { id: invoiceId },
        data: {
          status: isPaid ? "PAID" : "CANCELLED",
          paidAt: paidAtDate,
        },
      });

      // If PAID, extend/activate subscription duration
      if (isPaid && invoice.subscription) {
        const nextEndDate = new Date();
        nextEndDate.setMonth(nextEndDate.getMonth() + 1);

        await prisma.ownerSubscription.update({
          where: { id: invoice.subscriptionId },
          data: {
            status: "ACTIVE",
            endDate: nextEndDate,
          },
        });
      }

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          action: isPaid ? "VERIFY_INVOICE_PAYMENT_PAID" : "REJECT_INVOICE_PAYMENT",
          entityName: "SaaSInvoice",
          entityId: invoiceId,
          details: { invoiceNumber: invoice.invoiceNumber, amount: Number(invoice.amount), status },
          ipAddress: "127.0.0.1",
        },
      });

      return ApiResponse.success({
        message: `Invoice tagihan ${invoice.invoiceNumber} berhasil diverifikasi (${status})`,
        data: updatedInvoice,
      });
    }

    // 4. Manually Assign or Upgrade Owner Subscription
    if (action === "ASSIGN_SUBSCRIPTION") {
      const { ownerId, planId, durationMonths } = body;

      if (!ownerId || !planId) {
        return ApiResponse.error({
          message: "ownerId dan planId wajib diisi",
          status: 400,
        });
      }

      const [owner, plan] = await Promise.all([
        prisma.user.findUnique({ where: { id: ownerId } }),
        prisma.saaSPlan.findUnique({ where: { id: planId } }),
      ]);

      if (!owner || !plan) {
        return ApiResponse.error({
          message: "Owner atau Paket SaaS tidak ditemukan",
          status: 404,
        });
      }

      const startDate = new Date();
      const endDate = new Date();
      const monthsToAdd = parseInt(durationMonths || "1", 10);
      endDate.setMonth(endDate.getMonth() + monthsToAdd);

      const newSubscription = await prisma.ownerSubscription.create({
        data: {
          ownerId,
          planId,
          status: "ACTIVE",
          startDate,
          endDate,
          autoRenew: true,
        },
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          userId: ownerId,
          action: "ASSIGN_OWNER_SUBSCRIPTION",
          entityName: "OwnerSubscription",
          entityId: newSubscription.id,
          details: { ownerEmail: owner.email, planName: plan.name, durationMonths: monthsToAdd },
          ipAddress: "127.0.0.1",
        },
      });

      return ApiResponse.success({
        message: `Langganan paket ${plan.name} berhasil diberikan kepada ${owner.fullName}`,
        data: newSubscription,
      });
    }

    // 5. Create Manual SaaS Invoice
    if (action === "CREATE_INVOICE") {
      const { subscriptionId, amount, dueDate } = body;
      if (!subscriptionId || !amount) {
        return ApiResponse.error({
          message: "subscriptionId dan nominal (amount) wajib diisi",
          status: 400,
        });
      }

      const subscription = await prisma.ownerSubscription.findUnique({
        where: { id: subscriptionId },
        include: { owner: true, plan: true },
      });

      if (!subscription) {
        return ApiResponse.error({
          message: "Langganan owner tidak ditemukan",
          status: 404,
        });
      }

      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const due = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const newInvoice = await prisma.saaSInvoice.create({
        data: {
          subscriptionId,
          invoiceNumber,
          amount: parseFloat(amount),
          status: "PENDING",
          dueDate: due,
        },
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          action: "CREATE_MANUAL_SAAS_INVOICE",
          entityName: "SaaSInvoice",
          entityId: newInvoice.id,
          details: { invoiceNumber, ownerEmail: subscription.owner.email, amount: parseFloat(amount) },
          ipAddress: "127.0.0.1",
        },
      });

      return ApiResponse.success({
        message: `Tagihan invoice ${invoiceNumber} berhasil dibuat untuk ${subscription.owner.fullName}`,
        data: newInvoice,
      });
    }

    return ApiResponse.error({
      message: "Aksi tidak valid",
      status: 400,
    });
  } catch (error) {
    console.error("POST /api/admin/subscriptions error:", error);
    return ApiResponse.error({
      message: "Terjadi kesalahan server",
      error,
      status: 500,
    });
  }
}
