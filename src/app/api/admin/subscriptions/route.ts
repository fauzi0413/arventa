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
          planFeatures: {
            include: {
              feature: true,
            },
          },
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
          items: true,
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
      maxHousekeeping: plan.maxHousekeeping || 2,
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: Number(plan.priceYearly),
      featureIds: plan.planFeatures?.map((pf: any) => pf.featureId) || [],
      features:
        plan.planFeatures && plan.planFeatures.length > 0
          ? plan.planFeatures.map((pf: any) => pf.feature.name)
          : plan.features,
      status: planStatuses[plan.id] || plan.status || "ACTIVE",
      isDefault: Boolean(plan.isDefault),
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

    const cancelledInvoiceIds = invoicesList.filter((i: any) => i.status === "CANCELLED").map((i: any) => i.id);
    const cancelLogs = cancelledInvoiceIds.length > 0
      ? await prisma.auditLog.findMany({
          where: {
            entityId: { in: cancelledInvoiceIds },
            action: "CANCEL_SAAS_INVOICE_BY_OWNER",
          },
        })
      : [];

    const formattedInvoices = invoicesList.map((inv: any) => {
      const cancelLog = cancelLogs.find((l: any) => l.entityId === inv.id);
      const detailsObj: any = cancelLog?.details || {};

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        subscriptionId: inv.subscriptionId,
        ownerName: inv.subscription.owner.fullName,
        ownerEmail: inv.subscription.owner.email,
        planName: inv.subscription.plan.name,
        amount: Number(inv.amount),
        status: inv.status,
        paymentProof: inv.paymentProof,
        cancelReason: detailsObj.reason || null,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
        items: inv.items?.map((it: any) => ({
          id: it.id,
          itemTitle: it.itemTitle,
          amount: Number(it.unitPrice),
          unitPrice: Number(it.unitPrice),
          itemType: it.itemType,
        })) || [],
      };
    });

    // Compute Most Popular Plan dynamically from active subscriber counts
    const sortedPlansBySubscribers = [...formattedPlans].sort((a: any, b: any) => b.subscriberCount - a.subscriberCount);
    const mostPopularPlan = sortedPlansBySubscribers.length > 0 && sortedPlansBySubscribers[0].subscriberCount > 0
      ? sortedPlansBySubscribers[0].name
      : (formattedPlans.find((p: any) => p.status === "ACTIVE")?.name || "-");

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
          mostPopularPlan,
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

    // 0. Set Default Registration Plan
    if (action === "SET_DEFAULT_PLAN") {
      const { planId } = body;
      if (!planId) {
        return ApiResponse.error({ message: "ID paket wajib diisi", status: 400 });
      }

      await prisma.saaSPlan.updateMany({ data: { isDefault: false } });
      const updatedPlan = await prisma.saaSPlan.update({
        where: { id: planId },
        data: { isDefault: true },
      });

      return ApiResponse.success({
        message: `Paket "${updatedPlan.name}" berhasil ditetapkan sebagai Paket Default Pendaftaran Owner`,
        data: updatedPlan,
      });
    }

    // 1. Create New SaaS Subscription Tier Plan
    if (action === "CREATE_PLAN") {
      const { name, maxProperties, maxUnits, maxHousekeeping, priceMonthly, priceYearly, features, featureIds } = body;

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
          maxProperties: Math.max(0, parseInt(maxProperties || "1", 10)),
          maxUnits: Math.max(0, parseInt(maxUnits || "10", 10)),
          maxHousekeeping: Math.max(0, parseInt(maxHousekeeping || "2", 10)),
          priceMonthly: Math.max(0, parseFloat(priceMonthly)),
          priceYearly: Math.max(0, parseFloat(priceYearly || priceMonthly * 10)),
          features: Array.isArray(features) ? features : [],
          status: body.status || "ACTIVE",
        },
      });

      // Link featureIds if provided
      if (Array.isArray(featureIds) && featureIds.length > 0) {
        await prisma.saaSPlanFeature.createMany({
          data: featureIds.map((fId: string) => ({
            planId: newPlan.id,
            featureId: fId,
          })),
        });
      }

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          action: "CREATE_SAAS_PLAN",
          entityName: "SaaSPlan",
          entityId: newPlan.id,
          details: { name, priceMonthly, maxProperties, maxUnits, maxHousekeeping, status: newPlan.status },
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
      const { planId, name, maxProperties, maxUnits, maxHousekeeping, priceMonthly, priceYearly, features, featureIds, status } = body;

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
        maxProperties: maxProperties !== undefined ? Math.max(0, parseInt(maxProperties, 10)) : undefined,
        maxUnits: maxUnits !== undefined ? Math.max(0, parseInt(maxUnits, 10)) : undefined,
        maxHousekeeping: maxHousekeeping !== undefined ? Math.max(0, parseInt(maxHousekeeping, 10)) : undefined,
        priceMonthly: priceMonthly !== undefined ? Math.max(0, parseFloat(priceMonthly)) : undefined,
        priceYearly: priceYearly !== undefined ? Math.max(0, parseFloat(priceYearly)) : undefined,
        features: Array.isArray(features) ? features : undefined,
        status: status !== undefined ? status : undefined,
      };

      let updatedPlan: any;
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
            maxHousekeeping: parseInt(maxHousekeeping || "2", 10),
            priceMonthly: parseFloat(priceMonthly || "99000"),
            priceYearly: parseFloat(priceYearly || "990000"),
            features: Array.isArray(features) ? features : [],
            status: status || "ACTIVE",
          },
        });
      }

      // Sync featureIds in pivot table SaaSPlanFeature
      if (Array.isArray(featureIds) && updatedPlan?.id) {
        await prisma.saaSPlanFeature.deleteMany({
          where: { planId: updatedPlan.id },
        });
        if (featureIds.length > 0) {
          await prisma.saaSPlanFeature.createMany({
            data: featureIds.map((fId: string) => ({
              planId: updatedPlan.id,
              featureId: fId,
            })),
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
        include: {
          subscription: true,
          items: true,
        },
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

      // If PAID, update OwnerSubscription planId and extend subscription duration
      if (isPaid && invoice.subscription) {
        let targetPlanId = invoice.subscription.planId;
        let monthsToAdd = 1;

        // Check if invoice items contain a plan upgrade/renewal
        const planItem = invoice.items.find((item: any) => item.itemType === "PLAN");
        if (planItem) {
          if (planItem.itemTitle.includes("12 Bulan") || planItem.itemTitle.includes("1 Tahun")) {
            monthsToAdd = 12;
          } else if (planItem.itemTitle.includes("6 Bulan")) {
            monthsToAdd = 6;
          } else if (planItem.itemTitle.includes("3 Bulan")) {
            monthsToAdd = 3;
          }

          // Extract plan name from title, e.g. "Upgrade Paket Pengusaha (1 Bulan)" -> "Pengusaha"
          const allPlans = await prisma.saaSPlan.findMany({ where: { status: "ACTIVE" } });
          const matchedPlan = allPlans.find((p: any) =>
            planItem.itemTitle.toLowerCase().includes(p.name.toLowerCase())
          );
          if (matchedPlan) {
            targetPlanId = matchedPlan.id;
          }
        }

        const currentEnd = (invoice.subscription.endDate && new Date(invoice.subscription.endDate) > new Date())
          ? new Date(invoice.subscription.endDate)
          : new Date();
        const nextEndDate = new Date(currentEnd);
        nextEndDate.setMonth(nextEndDate.getMonth() + monthsToAdd);

        await prisma.ownerSubscription.update({
          where: { id: invoice.subscriptionId },
          data: {
            planId: targetPlanId,
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

    // 6. Delete SaaS Subscription Tier Plan
    if (action === "DELETE_PLAN") {
      const { planId } = body;
      if (!planId) {
        return ApiResponse.error({
          message: "planId wajib diisi",
          status: 400,
        });
      }

      const plan = await prisma.saaSPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return ApiResponse.error({
          message: "Paket SaaS tidak ditemukan",
          status: 404,
        });
      }

      if (plan.isDefault) {
        return ApiResponse.error({
          message: `Paket "${plan.name}" adalah Paket Default Pendaftaran dan tidak dapat dihapus. Silakan set paket lain sebagai Default terlebih dahulu.`,
          status: 400,
        });
      }

      const activeSubscriberCount = await prisma.ownerSubscription.count({
        where: { planId },
      });

      if (activeSubscriberCount > 0) {
        return ApiResponse.error({
          message: `Paket "${plan.name}" tidak dapat dihapus karena terdapat ${activeSubscriberCount} owner yang sedang berlangganan paket ini.`,
          status: 400,
        });
      }

      // Delete linked plan features pivot rows first
      await prisma.saaSPlanFeature.deleteMany({
        where: { planId },
      });

      // Delete the plan
      await prisma.saaSPlan.delete({
        where: { id: planId },
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          action: "DELETE_SAAS_PLAN",
          entityName: "SaaSPlan",
          entityId: planId,
          details: { name: plan.name, priceMonthly: Number(plan.priceMonthly) },
          ipAddress: "127.0.0.1",
        },
      });

      return ApiResponse.success({
        message: `Paket SaaS "${plan.name}" berhasil dihapus`,
        data: { id: planId, name: plan.name },
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
