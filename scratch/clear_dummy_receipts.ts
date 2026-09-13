import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  // Clear all dummy/mock receipt URLs (xyzstorage, unsplash, fake links)
  const result = await prisma.invoice.updateMany({
    where: {
      OR: [
        { paymentReceipt: { contains: 'xyzstorage.supabase.co' } },
        { paymentReceipt: { contains: 'images.unsplash.com' } },
        { paymentReceipt: { contains: 'inv_0001_paid' } }
      ]
    },
    data: {
      paymentReceipt: null
    }
  });

  console.log(`--- CLEARED ${result.count} DUMMY RECEIPT URLS FROM DATABASE ---`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
