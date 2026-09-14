import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { ExpenseService } from "@/services/expense.service";
import { ExpenseCategory } from "@/generated/prisma/client";

/**
 * GET /api/finance/expenses/[id]
 * Fetch a single expense by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    const { id } = await params;
    const expense = await ExpenseService.getExpenseById(id);

    if (!expense) {
      return ApiResponse.notFound("Expense record not found");
    }

    return ApiResponse.success({
      message: "Expense retrieved successfully",
      data: expense,
    });
  } catch (error: any) {
    console.error("GET /api/finance/expenses/[id] error:", error);
    return ApiResponse.error({ message: "Failed to fetch expense detail: " + (error.message || "Unknown error"), status: 500 });
  }
}

/**
 * PUT /api/finance/expenses/[id]
 * Update an existing expense record
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    const { id } = await params;
    const existing = await ExpenseService.getExpenseById(id);
    if (!existing) {
      return ApiResponse.notFound("Expense record not found");
    }

    const body = await request.json();
    const { title, category, amount, propertyId, unitId, expenseDate, receiptUrl, notes } = body;

    if (category && !Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
      return ApiResponse.badRequest(`Invalid category: ${category}`);
    }

    const updated = await ExpenseService.updateExpense(id, {
      title,
      category: category as ExpenseCategory,
      amount: amount !== undefined ? Number(amount) : undefined,
      propertyId,
      unitId,
      expenseDate,
      receiptUrl,
      notes,
    });

    return ApiResponse.success({
      message: "Expense updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/finance/expenses/[id] error:", error);
    return ApiResponse.error({ message: "Failed to update expense: " + (error.message || "Unknown error"), status: 500 });
  }
}

/**
 * DELETE /api/finance/expenses/[id]
 * Delete an expense record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    const { id } = await params;
    const existing = await ExpenseService.getExpenseById(id);
    if (!existing) {
      return ApiResponse.notFound("Expense record not found");
    }

    await ExpenseService.deleteExpense(id);

    return ApiResponse.success({
      message: "Expense deleted successfully",
      data: { id },
    });
  } catch (error: any) {
    console.error("DELETE /api/finance/expenses/[id] error:", error);
    return ApiResponse.error({ message: "Failed to delete expense: " + (error.message || "Unknown error"), status: 500 });
  }
}
