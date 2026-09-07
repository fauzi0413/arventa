"use client";

import React from "react";
import {
  IconX,
  IconPrinter,
  IconReceipt,
  IconBuilding,
  IconUser,
  IconCalendar,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconExternalLink,
} from "@tabler/icons-react";

interface InvoiceDetailData {
  id: string;
  invoiceNumber: string;
  amount: number | string;
  utilityAmount: number | string;
  penaltyAmount: number | string;
  totalAmount: number | string;
  dueDate: string;
  createdAt: string;
  paidAt?: string | null;
  status: string;
  paymentReceipt?: string | null;
  lease?: {
    rentalPeriod?: string;
    unit?: {
      unitNumber?: string;
      floor?: number;
      property?: {
        name?: string;
        address?: string;
        city?: string;
      };
    };
    tenant?: {
      fullName?: string;
      phoneNumber?: string;
      email?: string;
      user?: {
        fullName?: string;
        phoneNumber?: string;
        email?: string;
      };
    };
  };
}

interface DetailInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceDetailData | null;
}

export function DetailInvoiceModal({
  isOpen,
  onClose,
  invoice,
}: DetailInvoiceModalProps) {
  if (!isOpen || !invoice) return null;

  const property = invoice.lease?.unit?.property;
  const unit = invoice.lease?.unit;
  const tenant = invoice.lease?.tenant;
  const tenantUser = tenant?.user;

  const tenantName = tenant?.fullName || tenantUser?.fullName || "Penyewa";
  const tenantPhone = tenant?.phoneNumber || tenantUser?.phoneNumber || "-";
  const tenantEmail = tenant?.email || tenantUser?.email || "-";

  const numAmount = Number(invoice.amount || 0);
  const numUtility = Number(invoice.utilityAmount || 0);
  const numPenalty = Number(invoice.penaltyAmount || 0);
  const totalAmount = Number(invoice.totalAmount || 0);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
            <IconCheck className="h-3.5 w-3.5" /> LUNAS (PAID)
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">
            <IconAlertTriangle className="h-3.5 w-3.5" /> MENUNGGAK (OVERDUE)
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            DIBATALKAN (CANCELLED)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
            <IconClock className="h-3.5 w-3.5" /> MENUNGGU (PENDING)
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl text-slate-900 overflow-hidden flex flex-col max-h-[90vh] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/60 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <IconReceipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Kuitansi Digital & Detail Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            >
              <IconPrinter className="h-4 w-4" /> Cetak / Save PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200 print:text-black print:bg-white print:p-0">
          {/* Header Branding */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">ARVENTA</span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                  INVOICE SEWA
                </span>
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{property?.name || "Properti ARVENTA"}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{property?.address || ""}</p>
            </div>
            <div className="text-left sm:text-right space-y-1">
              <h2 className="text-lg font-black text-emerald-600 dark:text-emerald-400">#{invoice.invoiceNumber}</h2>
              <div>{getStatusBadge(invoice.status)}</div>
            </div>
          </div>

          {/* Info Columns: Tenant & Invoice Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
            {/* Tenant Info */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <IconUser className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Ditagihkan Kepada:
              </h4>
              <p className="font-black text-sm text-slate-900 dark:text-white">{tenantName}</p>
              <p className="text-slate-600 dark:text-slate-300">Unit: <span className="text-slate-900 dark:text-white font-bold">Unit {unit?.unitNumber || "-"}</span> (Lantai {unit?.floor || 1})</p>
              <p className="text-slate-600 dark:text-slate-300">No. HP: <span className="text-slate-900 dark:text-white font-medium">{tenantPhone}</span></p>
              <p className="text-slate-600 dark:text-slate-300">Email: <span className="text-slate-900 dark:text-white font-medium">{tenantEmail}</span></p>
            </div>

            {/* Invoice Timeline Info */}
            <div className="space-y-1.5 text-xs sm:text-right">
              <h4 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1 sm:justify-end">
                <IconCalendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Tanggal & Jatuh Tempo:
              </h4>
              <p className="text-slate-600 dark:text-slate-300">
                Tanggal Terbit:{" "}
                <span className="text-slate-900 dark:text-white font-bold">
                  {new Date(invoice.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Jatuh Tempo:{" "}
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  {new Date(invoice.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </p>
              {invoice.paidAt && (
                <p className="text-slate-600 dark:text-slate-300">
                  Tanggal Lunas:{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {new Date(invoice.paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Cost Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rincian Komponen Tagihan</h4>
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white dark:bg-slate-900 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Deskripsi Komponen</th>
                    <th className="px-4 py-3 text-right">Nominal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                  <tr>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">Biaya Sewa Utama Unit #{unit?.unitNumber}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">Rp {numAmount.toLocaleString("id-ID")}</td>
                  </tr>
                  {numUtility > 0 && (
                    <tr>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">Biaya Utilitas (Air / Listrik / Kebersihan / WiFi)</td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">Rp {numUtility.toLocaleString("id-ID")}</td>
                    </tr>
                  )}
                  {numPenalty > 0 && (
                    <tr>
                      <td className="px-4 py-3.5 text-rose-600 dark:text-rose-400 font-semibold">Denda Keterlambatan / Biaya Tambahan</td>
                      <td className="px-4 py-3.5 text-right font-bold text-rose-600 dark:text-rose-400">Rp {numPenalty.toLocaleString("id-ID")}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50/80 border-t border-slate-200 dark:bg-slate-800/80 dark:border-slate-800">
                  <tr>
                    <td className="px-4 py-3.5 font-black text-sm text-slate-900 dark:text-white">Total Tagihan Bersih</td>
                    <td className="px-4 py-3.5 text-right font-black text-base text-emerald-600 dark:text-emerald-400">
                      Rp {totalAmount.toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Proof / Receipt Attachment if available */}
          {invoice.paymentReceipt && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1 dark:bg-slate-800/40 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <IconReceipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Catatan / Bukti Pembayaran:
              </span>
              <p className="text-slate-900 dark:text-white font-mono text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 break-all flex items-center justify-between">
                <span>{invoice.paymentReceipt}</span>
                {invoice.paymentReceipt.startsWith("http") && (
                  <a
                    href={invoice.paymentReceipt}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:underline flex items-center gap-1 ml-2 font-bold"
                  >
                    Buka <IconExternalLink className="h-3 w-3" />
                  </a>
                )}
              </p>
            </div>
          )}

          {/* Footer Receipt Note */}
          <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-medium">
            Terima kasih atas pembayaran Anda. Simpan kuitansi ini sebagai bukti transaksi resmi ARVENTA.
          </div>
        </div>
      </div>
    </div>
  );
}
