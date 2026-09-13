import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('--- CHECK AUDIT LOGS FOR INVOICE UPLOADS ---');
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: {
        contains: 'PAYMENT'
      }
    },
    take: 20
  });
  console.log('Audit Logs:', JSON.stringify(auditLogs, null, 2));

  console.log('--- CHECK SUPABASE STORAGE BUCKETS & FILES ---');
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets, 'Error:', bucketErr);

  if (buckets) {
    for (const b of buckets) {
      const { data: files, error: filesErr } = await supabase.storage.from(b.name).list();
      console.log(`Files in bucket '${b.name}':`, files, 'Error:', filesErr);
    }
  }

  console.log('--- CHECK ALL INVOICES WITH PAYMENT RECEIPT ---');
  const invoicesWithReceipt = await prisma.invoice.findMany({
    where: {
      paymentReceipt: {
        not: null
      }
    },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      paymentReceipt: true
    }
  });
  console.log('Invoices with receipt:', invoicesWithReceipt);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
