import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const result = await prisma.invoice.updateMany({
    where: {
      paymentReceipt: {
        contains: 'xyzstorage.supabase.co'
      }
    },
    data: {
      paymentReceipt: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80'
    }
  });

  console.log(`--- UPDATED DUMMY RECEIPT URLS: ${result.count} RECORDS ---`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
