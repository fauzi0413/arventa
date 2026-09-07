// ---------------------------------------------------------------------------
// Client-Safe InvoiceStatus Enum
// ---------------------------------------------------------------------------
// Separate from `@/generated/prisma/client` to prevent importing Node.js
// built-in modules (`node:module`, `fs`, etc.) into Next.js Client Components
// which causes Turbopack browser chunking panics.
// ---------------------------------------------------------------------------

export enum InvoiceStatus {
  PENDING = "PENDING",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
  PARTIAL = "PARTIAL",
}

export type InvoiceStatusType = `${InvoiceStatus}`;
