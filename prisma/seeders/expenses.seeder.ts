import { prisma } from "../../src/lib/prisma";
import { Property, User, ExpenseCategory } from "../../generated/prisma/client";

interface SeedExpensesProps {
  kosGrahaAsri: Property;
  owner: User;
}

/**
 * Seed operational expenses (OpEx).
 * Idempotent: Checks by propertyId and title before creation.
 */
export async function seedExpenses({ kosGrahaAsri, owner }: SeedExpensesProps) {
  console.log("\n💸 Seeding Operational Expenses (Idempotent)...");

  let expense1 = await prisma.expense.findFirst({
    where: {
      propertyId: kosGrahaAsri.id,
      title: "Pembelian token listrik umum",
    },
  });

  if (!expense1) {
    expense1 = await prisma.expense.create({
      data: {
        propertyId: kosGrahaAsri.id,
        createdById: owner.id,
        title: "Pembelian token listrik umum",
        category: ExpenseCategory.UTILITY,
        amount: 200000,
        expenseDate: new Date(),
        receiptUrl:
          "https://xyzstorage.supabase.co/storage/v1/object/public/expenses/token_listrik_200k.jpg",
        notes: "Token listrik untuk area selasar, parkiran, dan koridor Kos Graha Asri.",
      },
    });
    console.log(`✅ Created Expense: ${expense1.title} - Rp ${expense1.amount}`);
  } else {
    console.log(`ℹ️ Existing Expense found: ${expense1.title}`);
  }

  let expense2 = await prisma.expense.findFirst({
    where: {
      propertyId: kosGrahaAsri.id,
      title: "Servis AC Kamar 101",
    },
  });

  if (!expense2) {
    expense2 = await prisma.expense.create({
      data: {
        propertyId: kosGrahaAsri.id,
        createdById: owner.id,
        title: "Servis AC Kamar 101",
        category: ExpenseCategory.MAINTENANCE,
        amount: 150000,
        expenseDate: new Date(),
        receiptUrl:
          "https://xyzstorage.supabase.co/storage/v1/object/public/expenses/servis_ac_101.jpg",
        notes: "Pembersihan filter dan cuci outdoor AC Kamar 101 Kos Graha Asri.",
      },
    });
    console.log(`✅ Created Expense: ${expense2.title} - Rp ${expense2.amount}`);
  } else {
    console.log(`ℹ️ Existing Expense found: ${expense2.title}`);
  }

  return {
    expense1,
    expense2,
  };
}
