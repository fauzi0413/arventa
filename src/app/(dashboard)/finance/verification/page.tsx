import { Metadata } from "next";
import { InvoiceVerificationView } from "@/components/finance/invoice-verification-view";

export const metadata: Metadata = {
  title: "Verifikasi Pembayaran & Rekening | ARVENTA",
  description: "Konfirmasi bukti pembayaran sewa tenant dan atur nomor rekening bank pengelola properti.",
};

export default function InvoiceVerificationPage() {
  return <InvoiceVerificationView />;
}
