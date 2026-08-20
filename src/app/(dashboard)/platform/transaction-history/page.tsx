import { TransactionHistoryManager } from "@/components/admin/transaction-history-manager";

export const metadata = {
  title: "Riwayat Transaksi | ARVENTA Admin",
  description: "Buku besar riwayat transaksi pembayaran SaaS platform, log audit keuangan, dan cetak kwitansi lunas.",
};

export default function PlatformTransactionHistoryPage() {
  return <TransactionHistoryManager />;
}
