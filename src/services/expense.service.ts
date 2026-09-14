import { prisma } from "@/lib/prisma";
import { ExpenseCategory } from "@/generated/prisma/client";

export interface ExpenseFilterInput {
  propertyId?: string;
  unitId?: string;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateExpenseInput {
  propertyId: string;
  unitId?: string | null;
  createdById: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: Date | string;
  receiptUrl?: string | null;
  notes?: string | null;
}

export interface UpdateExpenseInput {
  title?: string;
  category?: ExpenseCategory;
  amount?: number;
  propertyId?: string;
  unitId?: string | null;
  expenseDate?: Date | string;
  receiptUrl?: string | null;
  notes?: string | null;
}

export class ExpenseService {
  /**
   * Fetch paginated and filtered expenses strictly scoped to user's assigned or owned properties.
   */
  static async getExpensesForUser(
    ownerId?: string | null,
    filters?: ExpenseFilterInput,
    propertyIds?: string[]
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    // Scope to accessible properties
    const propertyScope: any = {};
    if (propertyIds && propertyIds.length > 0) {
      propertyScope.id = { in: propertyIds };
    } else if (ownerId) {
      propertyScope.ownerId = ownerId;
    }

    const whereClause: any = {};

    if (Object.keys(propertyScope).length > 0) {
      whereClause.property = propertyScope;
    }

    // Filter by specific property
    if (filters?.propertyId && filters.propertyId !== "ALL") {
      whereClause.propertyId = filters.propertyId;
    }

    // Filter by specific unit
    if (filters?.unitId && filters.unitId !== "ALL") {
      whereClause.unitId = filters.unitId;
    }

    // Filter by category
    if (filters?.category && filters.category !== "ALL") {
      whereClause.category = filters.category as ExpenseCategory;
    }

    // Search query by title, notes, or unit number
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      whereClause.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { unit: { unitNumber: { contains: q, mode: "insensitive" } } },
      ];
    }

    // Filter by Date Range (on expenseDate)
    if (filters?.startDate || filters?.endDate) {
      whereClause.expenseDate = {};
      if (filters.startDate) {
        whereClause.expenseDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.expenseDate.lte = end;
      }
    }

    // Fetch data and count in parallel
    const [expenses, totalCount, allExpensesAggregate, categoryGroup] = await Promise.all([
      prisma.expense.findMany({
        where: whereClause,
        include: {
          property: {
            select: { id: true, name: true, address: true },
          },
          unit: {
            select: { id: true, unitNumber: true, floor: true },
          },
          createdBy: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
        orderBy: { expenseDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where: whereClause }),
      prisma.expense.aggregate({
        where: whereClause,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: whereClause,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    // Current month start & end for month stats
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthWhere = {
      ...whereClause,
      expenseDate: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    };

    const monthAggregate = await prisma.expense.aggregate({
      where: monthWhere,
      _sum: { amount: true },
      _count: { id: true },
    });

    const categoryBreakdown = categoryGroup.map((item) => ({
      category: item.category,
      totalAmount: Number(item._sum.amount || 0),
      count: item._count.id,
    }));

    return {
      data: expenses.map((exp) => ({
        ...exp,
        amount: Number(exp.amount),
      })),
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        stats: {
          totalAmount: Number(allExpensesAggregate._sum.amount || 0),
          totalCount: allExpensesAggregate._count.id || 0,
          monthAmount: Number(monthAggregate._sum.amount || 0),
          monthCount: monthAggregate._count.id || 0,
          categoryBreakdown,
        },
      },
    };
  }

  /**
   * Get single expense by ID
   */
  static async getExpenseById(id: string) {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, name: true, address: true, ownerId: true },
        },
        unit: {
          select: { id: true, unitNumber: true, floor: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    if (!expense) return null;

    return {
      ...expense,
      amount: Number(expense.amount),
    };
  }

  /**
   * Create a new expense record
   */
  static async createExpense(input: CreateExpenseInput) {
    const expense = await prisma.expense.create({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId || null,
        createdById: input.createdById,
        title: input.title,
        category: input.category,
        amount: input.amount,
        expenseDate: new Date(input.expenseDate),
        receiptUrl: input.receiptUrl || null,
        notes: input.notes || null,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        unit: {
          select: { id: true, unitNumber: true, floor: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    return {
      ...expense,
      amount: Number(expense.amount),
    };
  }

  /**
   * Update an existing expense record
   */
  static async updateExpense(id: string, input: UpdateExpenseInput) {
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.propertyId !== undefined) updateData.propertyId = input.propertyId;
    if (input.unitId !== undefined) updateData.unitId = input.unitId || null;
    if (input.expenseDate !== undefined) updateData.expenseDate = new Date(input.expenseDate);
    if (input.receiptUrl !== undefined) updateData.receiptUrl = input.receiptUrl;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        unit: {
          select: { id: true, unitNumber: true, floor: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    return {
      ...expense,
      amount: Number(expense.amount),
    };
  }

  /**
   * Delete an expense record
   */
  static async deleteExpense(id: string) {
    return prisma.expense.delete({
      where: { id },
    });
  }
}
