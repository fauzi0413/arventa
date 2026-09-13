import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const inv = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        contains: 'INV/2026/01/0001'
      }
    }
  });

  console.log('--- INVOICE PAYMENT RECEIPT FIELD ---');
  console.log({
    invoiceNumber: inv?.invoiceNumber,
    paymentReceipt: inv?.paymentReceipt,
    status: inv?.status
  });

  const verifInvoices = await prisma.invoice.findMany({
    where: {
      paymentReceipt: { not: null }
    },
    take: 10
  });

  console.log('--- INVOICES WITH PAYMENT RECEIPT ---');
  console.log(verifInvoices.map(i => ({
    invoiceNumber: i.invoiceNumber,
    paymentReceipt: i.paymentReceipt,
    status: i.status
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
