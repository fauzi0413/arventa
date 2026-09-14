import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { prisma } from "@/lib/prisma";
import { ExpenseService } from "@/services/expense.service";
import { ExpenseCategory } from "@/generated/prisma/client";

/**
 * Helper to resolve property scoping based on logged-in user & role
 */
async function resolveUserAccessScope(authUser: any) {
  let ownerId: string | undefined = undefined;
  let propertyIds: string[] | undefined = undefined;
  let hasAccess = true;

  if (authUser.role === UserRole.OWNER) {
    const ownedProperties = await prisma.property.findMany({
      where: { ownerId: authUser.id },
      select: { id: true },
    });
    ownerId = authUser.id;
    propertyIds = ownedProperties.map((p) => p.id);
    if (propertyIds.length === 0) {
      hasAccess = false;
    }
  } else if (authUser.role === UserRole.HOUSEKEEPING) {
    const assignments = await prisma.housekeepingAssignment.findMany({
      where: { userId: authUser.id },
      select: { propertyId: true },
    });
    propertyIds = assignments.map((a) => a.propertyId);
    if (propertyIds.length === 0) {
      hasAccess = false;
    }
  }

  return { ownerId, propertyIds, hasAccess };
}

/**
 * GET /api/finance/expenses
 * Fetch paginated & filtered list of operational expenses (OpEx) scoped to logged-in user's properties.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required to access expenses");
    }

    const { ownerId, propertyIds, hasAccess } = await resolveUserAccessScope(authUser);

    if (!hasAccess) {
      return ApiResponse.success({
        message: "Expenses retrieved successfully",
        data: [],
        meta: {
          page: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          stats: {
            totalAmount: 0,
            totalCount: 0,
            monthAmount: 0,
            monthCount: 0,
            categoryBreakdown: [],
          },
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const propertyId = searchParams.get("propertyId") || undefined;
    const unitId = searchParams.get("unitId") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const result = await ExpenseService.getExpensesForUser(
      ownerId,
      {
        page,
        limit,
        propertyId,
        unitId,
        category,
        search,
        startDate,
        endDate,
      },
      propertyIds
    );

    return ApiResponse.success({
      message: "Expenses retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error("GET /api/finance/expenses error:", error);
    return ApiResponse.error({ message: "Failed to fetch expenses: " + (error.message || "Unknown error"), status: 500 });
  }
}

/**
 * POST /api/finance/expenses
 * Create a new operational expense (OpEx) record
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required to create expense");
    }

    const body = await request.json();
    const { propertyId, unitId, title, category, amount, expenseDate, receiptUrl, notes } = body;

    if (!propertyId || !title || !category || amount === undefined || amount === null || !expenseDate) {
      return ApiResponse.badRequest("Fields propertyId, title, category, amount, and expenseDate are required");
    }

    // Verify user access to target property
    const { ownerId, propertyIds, hasAccess } = await resolveUserAccessScope(authUser);
    if (!hasAccess) {
      return ApiResponse.forbidden("You do not have access to any properties");
    }

    if (propertyIds && !propertyIds.includes(propertyId)) {
      return ApiResponse.forbidden("You do not have permission to add expenses for this property");
    }

    if (ownerId) {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { ownerId: true },
      });
      if (!prop || prop.ownerId !== ownerId) {
        return ApiResponse.forbidden("You do not own this property");
      }
    }

    // Validate category enum
    if (!Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
      return ApiResponse.badRequest(`Invalid category: ${category}`);
    }

    const expense = await ExpenseService.createExpense({
      propertyId,
      unitId: unitId || null,
      createdById: authUser.id,
      title,
      category: category as ExpenseCategory,
      amount: Number(amount),
      expenseDate,
      receiptUrl: receiptUrl || null,
      notes: notes || null,
    });

    return ApiResponse.success({ message: "Expense created successfully", data: expense, status: 201 });
  } catch (error: any) {
    console.error("POST /api/finance/expenses error:", error);
    return ApiResponse.error({ message: "Failed to create expense: " + (error.message || "Unknown error"), status: 500 });
  }
}
