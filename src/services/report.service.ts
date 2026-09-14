import { prisma } from "@/lib/prisma";

export interface ReportFilterInput {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
}

export class ReportService {
  private static buildPropertyScope(ownerId?: string | null, propertyIds?: string[], selectedPropId?: string) {
    const scope: any = {};
    if (selectedPropId && selectedPropId !== "ALL") {
      scope.id = selectedPropId;
    } else if (propertyIds && propertyIds.length > 0) {
      scope.id = { in: propertyIds };
    } else if (ownerId) {
      scope.ownerId = ownerId;
    }
    return scope;
  }

  private static buildDateRange(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return undefined;
    const dateRange: any = {};
    if (startDate) {
      dateRange.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateRange.lte = end;
    }
    return dateRange;
  }

  /**
   * 1. LAPORAN KEUANGAN (Financial Report & Owner Analytics with MoM Trends & Charts)
   */
  static async getFinancialReport(
    ownerId?: string | null,
    filters?: ReportFilterInput,
    propertyIds?: string[]
  ) {
    const propScope = this.buildPropertyScope(ownerId, propertyIds, filters?.propertyId);
    const dateRange = this.buildDateRange(filters?.startDate, filters?.endDate);

    const baseLeasePropertyClause = Object.keys(propScope).length > 0
      ? { lease: { unit: { property: propScope } } }
      : {};

    const basePropertyClause = Object.keys(propScope).length > 0
      ? { property: propScope }
      : {};

    // Robust Invoice Date Clause (paidAt OR dueDate/createdAt fallback)
    const invoiceDateClause = dateRange
      ? {
          OR: [
            { paidAt: dateRange },
            { paidAt: null, dueDate: dateRange },
            { paidAt: null, createdAt: dateRange },
          ],
        }
      : {};

    // Paid Invoices Clause
    const paidInvoiceWhere: any = {
      status: "PAID",
      ...baseLeasePropertyClause,
      ...invoiceDateClause,
    };

    // Pending & Overdue Invoices Clause (Piutang)
    const pendingInvoiceWhere: any = {
      status: { in: ["PENDING", "OVERDUE"] },
      ...baseLeasePropertyClause,
    };

    const overdueInvoiceWhere: any = {
      status: "OVERDUE",
      ...baseLeasePropertyClause,
    };

    // Expenses Clause
    const expenseWhere: any = {
      ...basePropertyClause,
      ...(dateRange && { expenseDate: dateRange }),
    };

    // Fetch Properties
    const properties = await prisma.property.findMany({
      where: Object.keys(propScope).length > 0 ? propScope : undefined,
      select: { id: true, name: true, address: true },
    });

    // 6 Months Historical Monthly Trend Query
    const now = new Date();
    const monthlyTrendPromises = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = mStart.toLocaleDateString("id-ID", { month: "short" });

      monthlyTrendPromises.push(
        Promise.all([
          prisma.invoice.aggregate({
            where: {
              status: "PAID",
              ...baseLeasePropertyClause,
              OR: [
                { paidAt: { gte: mStart, lte: mEnd } },
                { paidAt: null, dueDate: { gte: mStart, lte: mEnd } },
                { paidAt: null, createdAt: { gte: mStart, lte: mEnd } },
              ],
            },
            _sum: { totalAmount: true },
          }),
          prisma.expense.aggregate({
            where: {
              ...basePropertyClause,
              expenseDate: { gte: mStart, lte: mEnd },
            },
            _sum: { amount: true },
          }),
        ]).then(([invRes, expRes]) => {
          const rev = Number(invRes._sum.totalAmount || 0);
          const exp = Number(expRes._sum.amount || 0);
          return {
            month: monthLabel,
            year: d.getFullYear(),
            grossRevenue: rev,
            expensesAmount: exp,
            netIncome: rev - exp,
          };
        })
      );
    }

    const [
      paidInvoicesAgg,
      pendingInvoicesAgg,
      overdueInvoicesAgg,
      expensesAgg,
      categoryExpensesGroup,
      propertyInvoices,
      propertyExpenses,
      monthlyTrendResults,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: paidInvoiceWhere,
        _sum: { amount: true, utilityAmount: true, penaltyAmount: true, totalAmount: true },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: pendingInvoiceWhere,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: overdueInvoiceWhere,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: expenseWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: expenseWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.invoice.findMany({
        where: paidInvoiceWhere,
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          utilityAmount: true,
          penaltyAmount: true,
          totalAmount: true,
          paidAt: true,
          lease: {
            select: {
              unit: {
                select: {
                  unitNumber: true,
                  property: { select: { id: true, name: true } },
                },
              },
              tenant: { select: { fullName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.expense.findMany({
        where: expenseWhere,
        select: {
          id: true,
          title: true,
          category: true,
          amount: true,
          expenseDate: true,
          property: { select: { id: true, name: true } },
          unit: { select: { unitNumber: true } },
        },
        orderBy: { expenseDate: "desc" },
        take: 30,
      }),
      Promise.all(monthlyTrendPromises),
    ]);

    const grossRevenue = Number(paidInvoicesAgg._sum.totalAmount || 0);
    const rentRevenue = Number(paidInvoicesAgg._sum.amount || 0);
    const utilityRevenue = Number(paidInvoicesAgg._sum.utilityAmount || 0);
    const penaltyRevenue = Number(paidInvoicesAgg._sum.penaltyAmount || 0);
    const pendingRevenue = Number(pendingInvoicesAgg._sum.totalAmount || 0);
    const overdueRevenue = Number(overdueInvoicesAgg._sum.totalAmount || 0);

    const totalExpenses = Number(expensesAgg._sum.amount || 0);
    const netIncome = grossRevenue - totalExpenses;
    const profitMargin = grossRevenue > 0 ? (netIncome / grossRevenue) * 100 : 0;

    // Calculate Month-over-Month Growth % (Current Month vs Previous Month)
    const currM = monthlyTrendResults[5] || { grossRevenue: 0, netIncome: 0, expensesAmount: 0 };
    const prevM = monthlyTrendResults[4] || { grossRevenue: 0, netIncome: 0, expensesAmount: 0 };

    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const momTrends = {
      revenueGrowth: calcGrowth(currM.grossRevenue, prevM.grossRevenue),
      netIncomeGrowth: calcGrowth(currM.netIncome, prevM.netIncome),
      expenseGrowth: calcGrowth(currM.expensesAmount, prevM.expensesAmount),
    };

    // Expense Category Breakdown
    const expenseCategoryBreakdown = categoryExpensesGroup.map((c) => {
      const amt = Number(c._sum.amount || 0);
      const percentage = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
      return {
        category: c.category,
        totalAmount: amt,
        count: c._count.id,
        percentage: Number(percentage.toFixed(1)),
      };
    });

    // Property Breakdown with Profit Margins
    const propertyBreakdown = await Promise.all(
      properties.map(async (prop) => {
        const propInvWhere: any = {
          status: "PAID",
          lease: { unit: { propertyId: prop.id } },
          ...invoiceDateClause,
        };
        const propExpWhere: any = {
          propertyId: prop.id,
          ...(dateRange && { expenseDate: dateRange }),
        };

        const [invAgg, expAgg] = await Promise.all([
          prisma.invoice.aggregate({
            where: propInvWhere,
            _sum: { totalAmount: true },
            _count: { id: true },
          }),
          prisma.expense.aggregate({
            where: propExpWhere,
            _sum: { amount: true },
            _count: { id: true },
          }),
        ]);

        const income = Number(invAgg._sum.totalAmount || 0);
        const opex = Number(expAgg._sum.amount || 0);
        const net = income - opex;
        const propMargin = income > 0 ? (net / income) * 100 : 0;
        const revenueShare = grossRevenue > 0 ? (income / grossRevenue) * 100 : 0;

        return {
          propertyId: prop.id,
          propertyName: prop.name,
          grossIncome: income,
          expensesAmount: opex,
          netIncome: net,
          profitMargin: Number(propMargin.toFixed(1)),
          revenueShare: Number(revenueShare.toFixed(1)),
          invoiceCount: invAgg._count.id,
          expenseCount: expAgg._count.id,
        };
      })
    );

    // Dynamic Executive Insights
    const executiveInsights: string[] = [];
    if (grossRevenue > 0) {
      const growthLabel = momTrends.revenueGrowth >= 0 ? `+${momTrends.revenueGrowth}%` : `${momTrends.revenueGrowth}%`;
      executiveInsights.push(
        `Pendapatan kotor bulan ini mengalami pertumbuhan ${growthLabel} dibanding bulan lalu, dengan Margin Keuntungan bersih (Profit Margin) di angka ${profitMargin.toFixed(1)}%.`
      );
    } else {
      executiveInsights.push("Belum ada transaksi pembayaran invoice lunas yang tercatat pada rentang tanggal terfilter ini.");
    }

    if (overdueRevenue > 0) {
      executiveInsights.push(
        `Perhatian: Terdapat piutang sewa menunggak (Overdue) sebesar Rp ${overdueRevenue.toLocaleString("id-ID")} dari ${overdueInvoicesAgg._count.id} tagihan yang memerlukan penagihan.`
      );
    }

    const topProp = [...propertyBreakdown].sort((a, b) => b.grossIncome - a.grossIncome)[0];
    if (topProp && topProp.grossIncome > 0) {
      executiveInsights.push(
        `Properti "${topProp.propertyName}" memberikan kontribusi pendapatan terbesar (${topProp.revenueShare}%) dengan laba bersih Rp ${topProp.netIncome.toLocaleString("id-ID")}.`
      );
    }

    return {
      summary: {
        grossRevenue,
        rentRevenue,
        utilityRevenue,
        penaltyRevenue,
        pendingRevenue,
        pendingCount: pendingInvoicesAgg._count.id,
        overdueRevenue,
        overdueCount: overdueInvoicesAgg._count.id,
        totalExpenses,
        netIncome,
        profitMargin: Number(profitMargin.toFixed(1)),
        paidInvoiceCount: paidInvoicesAgg._count.id,
        expenseCount: expensesAgg._count.id,
      },
      momTrends,
      monthlyTrend: monthlyTrendResults,
      expenseCategoryBreakdown,
      propertyBreakdown,
      executiveInsights,
      recentInvoices: propertyInvoices.map((inv) => ({
        ...inv,
        amount: Number(inv.amount),
        utilityAmount: Number(inv.utilityAmount),
        penaltyAmount: Number(inv.penaltyAmount),
        totalAmount: Number(inv.totalAmount),
      })),
      recentExpenses: propertyExpenses.map((exp) => ({
        ...exp,
        amount: Number(exp.amount),
      })),
    };
  }

  /**
   * 2. LAPORAN OKUPANSI (Occupancy & Yield Analysis)
   */
  static async getOccupancyReport(
    ownerId?: string | null,
    filters?: ReportFilterInput,
    propertyIds?: string[]
  ) {
    const propScope = this.buildPropertyScope(ownerId, propertyIds, filters?.propertyId);

    const unitWhere: any = {};
    if (Object.keys(propScope).length > 0) {
      unitWhere.property = propScope;
    }

    const properties = await prisma.property.findMany({
      where: Object.keys(propScope).length > 0 ? propScope : undefined,
      select: { id: true, name: true, address: true },
    });

    const [totalUnits, occupiedUnits, availableUnits, maintenanceUnits, reservedUnits, unitsList] =
      await Promise.all([
        prisma.unit.count({ where: unitWhere }),
        prisma.unit.count({ where: { ...unitWhere, status: "OCCUPIED" } }),
        prisma.unit.count({ where: { ...unitWhere, status: "AVAILABLE" } }),
        prisma.unit.count({ where: { ...unitWhere, status: "MAINTENANCE" } }),
        prisma.unit.count({ where: { ...unitWhere, status: "RESERVED" } }),
        prisma.unit.findMany({
          where: unitWhere,
          select: {
            id: true,
            unitNumber: true,
            floor: true,
            status: true,
            property: { select: { id: true, name: true } },
            leases: {
              where: { status: "ACTIVE" },
              select: {
                rentPrice: true,
                startDate: true,
                endDate: true,
                tenant: { select: { fullName: true, phoneNumber: true } },
              },
              take: 1,
            },
          },
          orderBy: [{ propertyId: "asc" }, { unitNumber: "asc" }],
        }),
      ]);

    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    let realizedMonthlyRent = 0;
    unitsList.forEach((u) => {
      if (u.leases.length > 0) {
        realizedMonthlyRent += Number(u.leases[0].rentPrice);
      }
    });

    const avgRentPrice = occupiedUnits > 0 ? realizedMonthlyRent / occupiedUnits : 1500000;
    const maxPotentialMonthlyRent = totalUnits * avgRentPrice;
    const vacancyLoss = Math.max(0, maxPotentialMonthlyRent - realizedMonthlyRent);

    // Property Breakdown
    const propertyOccupancy = await Promise.all(
      properties.map(async (prop) => {
        const pUnitsWhere = { propertyId: prop.id };
        const [pTotal, pOccupied, pAvailable, pMaint] = await Promise.all([
          prisma.unit.count({ where: pUnitsWhere }),
          prisma.unit.count({ where: { ...pUnitsWhere, status: "OCCUPIED" } }),
          prisma.unit.count({ where: { ...pUnitsWhere, status: "AVAILABLE" } }),
          prisma.unit.count({ where: { ...pUnitsWhere, status: "MAINTENANCE" } }),
        ]);

        const pRate = pTotal > 0 ? (pOccupied / pTotal) * 100 : 0;
        return {
          propertyId: prop.id,
          propertyName: prop.name,
          totalUnits: pTotal,
          occupiedUnits: pOccupied,
          availableUnits: pAvailable,
          maintenanceUnits: pMaint,
          occupancyRate: Number(pRate.toFixed(1)),
        };
      })
    );

    const executiveInsights: string[] = [
      `Tingkat hunian (Occupancy Rate) keseluruhan saat ini di angka ${occupancyRate.toFixed(1)}% (${occupiedUnits} dari ${totalUnits} kamar terisi).`,
      availableUnits > 0
        ? `Terdapat ${availableUnits} unit kosong. Mengisi unit ini berpotensi menambah pendapatan sewa hingga Rp ${vacancyLoss.toLocaleString("id-ID")}/bulan.`
        : "Seluruh unit kamar terisi penuh (100% Occupancy). Performa bisnis optimal!",
    ];

    return {
      summary: {
        totalUnits,
        occupiedUnits,
        availableUnits,
        maintenanceUnits,
        reservedUnits,
        occupancyRate: Number(occupancyRate.toFixed(1)),
        realizedMonthlyRent,
        maxPotentialMonthlyRent,
        vacancyLoss,
      },
      propertyBreakdown: propertyOccupancy,
      executiveInsights,
      units: unitsList.map((u) => ({
        ...u,
        activeLease: u.leases[0]
          ? {
              ...u.leases[0],
              rentPrice: Number(u.leases[0].rentPrice),
            }
          : null,
      })),
    };
  }

  /**
   * 3. LAPORAN PENYEWA (Tenant Compliance & Leases)
   */
  static async getTenantReport(
    ownerId?: string | null,
    filters?: ReportFilterInput,
    propertyIds?: string[]
  ) {
    const propScope = this.buildPropertyScope(ownerId, propertyIds, filters?.propertyId);

    const leaseWhere: any = {
      ...(Object.keys(propScope).length > 0 && {
        unit: { property: propScope },
      }),
    };

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const in60Days = new Date();
    in60Days.setDate(now.getDate() + 60);

    const [
      activeLeasesCount,
      totalTenantsCount,
      leasesExpiring30Days,
      leasesExpiring60Days,
      totalDepositAgg,
      leases,
    ] = await Promise.all([
      prisma.lease.count({ where: { ...leaseWhere, status: "ACTIVE" } }),
      prisma.tenantProfile.count({
        where: Object.keys(propScope).length > 0 ? { leases: { some: { unit: { property: propScope } } } } : undefined,
      }),
      prisma.lease.count({
        where: {
          ...leaseWhere,
          status: "ACTIVE",
          endDate: { gte: now, lte: in30Days },
        },
      }),
      prisma.lease.count({
        where: {
          ...leaseWhere,
          status: "ACTIVE",
          endDate: { gte: now, lte: in60Days },
        },
      }),
      prisma.lease.aggregate({
        where: { ...leaseWhere, status: "ACTIVE" },
        _sum: { securityDeposit: true },
      }),
      prisma.lease.findMany({
        where: leaseWhere,
        include: {
          tenant: {
            select: { id: true, fullName: true, phoneNumber: true, email: true, emergencyName: true },
          },
          unit: {
            select: {
              id: true,
              unitNumber: true,
              property: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { startDate: "desc" },
        take: 100,
      }),
    ]);

    const executiveInsights: string[] = [
      `Saat ini terdapat ${activeLeasesCount} kontrak sewa aktif dengan total dana jaminan (Security Deposit) tersimpan Rp ${(Number(totalDepositAgg._sum.securityDeposit) || 0).toLocaleString("id-ID")}.`,
      leasesExpiring30Days > 0
        ? `Terdapat ${leasesExpiring30Days} kontrak penyewa yang akan berakhir dalam 30 hari ke depan. Disarankan menghubungi penyewa untuk konfirmasi perpanjangan sewa.`
        : "Tidak ada masa sewa yang akan berakhir dalam 30 hari ke depan.",
    ];

    return {
      summary: {
        activeLeasesCount,
        totalTenantsCount,
        leasesExpiring30Days,
        leasesExpiring60Days,
        totalSecurityDeposit: Number(totalDepositAgg._sum.securityDeposit || 0),
      },
      executiveInsights,
      leases: leases.map((l) => ({
        ...l,
        rentPrice: Number(l.rentPrice),
        securityDeposit: Number(l.securityDeposit),
        lateFeeAmount: Number(l.lateFeeAmount),
      })),
    };
  }

  /**
   * 4. LAPORAN OPERASIONAL (Maintenance & Staff Output)
   */
  static async getOperationalReport(
    ownerId?: string | null,
    filters?: ReportFilterInput,
    propertyIds?: string[]
  ) {
    const propScope = this.buildPropertyScope(ownerId, propertyIds, filters?.propertyId);
    const dateRange = this.buildDateRange(filters?.startDate, filters?.endDate);

    const ticketWhere: any = {
      ...(Object.keys(propScope).length > 0 && {
        property: propScope,
      }),
      ...(dateRange && { createdAt: dateRange }),
    };

    const [
      totalTickets,
      reportedCount,
      inProgressCount,
      resolvedCount,
      cancelledCount,
      costAgg,
      priorityGroup,
      tickets,
    ] = await Promise.all([
      prisma.maintenanceTicket.count({ where: ticketWhere }),
      prisma.maintenanceTicket.count({ where: { ...ticketWhere, status: "REPORTED" } }),
      prisma.maintenanceTicket.count({ where: { ...ticketWhere, status: "IN_PROGRESS" } }),
      prisma.maintenanceTicket.count({ where: { ...ticketWhere, status: "RESOLVED" } }),
      prisma.maintenanceTicket.count({ where: { ...ticketWhere, status: "CANCELLED" } }),
      prisma.maintenanceTicket.aggregate({
        where: ticketWhere,
        _sum: { actualCost: true, estimatedCost: true },
      }),
      prisma.maintenanceTicket.groupBy({
        by: ["priority"],
        where: ticketWhere,
        _count: { id: true },
      }),
      prisma.maintenanceTicket.findMany({
        where: ticketWhere,
        include: {
          property: { select: { id: true, name: true } },
          unit: { select: { id: true, unitNumber: true } },
          assignedStaff: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const resolutionRate = totalTickets > 0 ? (resolvedCount / totalTickets) * 100 : 0;
    const totalCost = Number(costAgg._sum.actualCost || 0);

    const executiveInsights: string[] = [
      `Tingkat penyelesaian laporan perbaikan operasional saat ini mencapai ${resolutionRate.toFixed(1)}% (${resolvedCount} dari ${totalTickets} tiket selesai).`,
      totalCost > 0
        ? `Total akumulasi biaya aktual perbaikan fasilitas mencapai Rp ${totalCost.toLocaleString("id-ID")}.`
        : "Belum ada pengeluaran biaya perbaikan aktual yang dicatat pada tiket perbaikan.",
    ];

    return {
      summary: {
        totalTickets,
        reportedCount,
        inProgressCount,
        resolvedCount,
        cancelledCount,
        resolutionRate: Number(resolutionRate.toFixed(1)),
        totalActualCost: totalCost,
        totalEstimatedCost: Number(costAgg._sum.estimatedCost || 0),
        priorityBreakdown: priorityGroup.map((p) => ({
          priority: p.priority,
          count: p._count.id,
        })),
      },
      executiveInsights,
      tickets: tickets.map((t) => ({
        ...t,
        estimatedCost: t.estimatedCost ? Number(t.estimatedCost) : null,
        actualCost: t.actualCost ? Number(t.actualCost) : null,
      })),
    };
  }
}
