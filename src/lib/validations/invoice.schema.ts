import { z } from "zod";
import { InvoiceStatus } from "@/types/finance";

export const createInvoiceSchema = z.object({
  leaseId: z.string().min(1, "Pilih penyewa / unit terlebih dahulu"),
  amount: z.number().min(0, "Nominal sewa tidak boleh negatif"),
  utilityAmount: z.number().min(0, "Nominal utilitas tidak boleh negatif").default(0),
  penaltyAmount: z.number().min(0, "Nominal denda/biaya lain tidak boleh negatif").default(0),
  dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  amount: z.number().min(0, "Nominal sewa tidak boleh negatif").optional(),
  utilityAmount: z.number().min(0, "Nominal utilitas tidak boleh negatif").optional(),
  penaltyAmount: z.number().min(0, "Nominal denda tidak boleh negatif").optional(),
  dueDate: z.string().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  paymentReceipt: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.nativeEnum(InvoiceStatus, {
    errorMap: () => ({ message: "Status invoice wajib dipilih" }),
  }),
  paymentReceipt: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
});

export const invoiceFilterSchema = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>;
