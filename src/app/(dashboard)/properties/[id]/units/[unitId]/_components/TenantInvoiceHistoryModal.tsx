'use client';

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  User,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  Search,
  FileText,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export interface InvoiceHistoryItem {
  id: string;
  invoiceNumber: string;
  periodName?: string;
  amount: number | string;
  totalAmount?: number | string;
  dueDate: string;
  createdAt?: string;
  paidAt?: string | null;
  status: 'PAID' | 'UNPAID' | 'PENDING' | 'OVERDUE' | string;
  paymentMethod?: string;
  paymentReceipt?: string | null;
  notes?: string;
}

interface TenantInvoiceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantName: string;
  tenantPhone?: string;
  checkInDate?: string;
  unitName: string;
  propertyName: string;
  monthlyRate: number;
  invoices: InvoiceHistoryItem[];
}

export default function TenantInvoiceHistoryModal({
  isOpen,
  onClose,
  tenantName,
  checkInDate,
  unitName,
  propertyName,
  monthlyRate,
  invoices,
}: TenantInvoiceHistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 15;

  if (!isOpen) return null;

  const parseNumericAmount = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9]/g, '');
    return Number(cleaned) || 0;
  };

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(parseNumericAmount(val));
  };

  // STRICTLY USE 100% REAL DATABASE INVOICES ONLY (NO MOCK/FALLBACK DUMMY DATA)
  const tenantInvoices: InvoiceHistoryItem[] = (Array.isArray(invoices) ? invoices : []).map((inv: any) => {
    const numAmt = parseNumericAmount(inv.totalAmount ?? inv.amount ?? monthlyRate);
    const due = inv.dueDate || inv.createdAt || new Date().toISOString();
    const dueObj = new Date(due);
    const monthName = !isNaN(dueObj.getTime())
      ? dueObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      : 'Bulan Ini';

    return {
      id: inv.id || `inv-${Math.random()}`,
      invoiceNumber: inv.invoiceNumber || `INV-${inv.id?.slice(0, 8) || '001'}`,
      periodName: inv.periodName || `Tagihan ${monthName}`,
      amount: numAmt,
      dueDate: due,
      createdAt: inv.createdAt,
      paidAt: inv.paidAt || null,
      status: inv.status || 'UNPAID',
      paymentMethod: inv.paymentReceipt ? 'Transfer / Dokumen' : undefined,
      paymentReceipt: inv.paymentReceipt || null,
      notes: inv.notes || '',
    };
  });

  const filteredInvoices = tenantInvoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.periodName && inv.periodName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      inv.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPaid = tenantInvoices
    .filter((i) => i.status === 'PAID')
    .reduce((acc, curr) => acc + parseNumericAmount(curr.amount), 0);

  const totalUnpaid = tenantInvoices
    .filter((i) => i.status !== 'PAID')
    .reduce((acc, curr) => acc + parseNumericAmount(curr.amount), 0);

  const paidCount = tenantInvoices.filter((i) => i.status === 'PAID').length;
  const unpaidCount = tenantInvoices.filter((i) => i.status !== 'PAID').length;

  const handleCopyInvoiceNumber = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sort filtered invoices by dueDate ASCENDING (Terlama -> Terbaru)
  const sortedInvoices = [...filteredInvoices].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  // Pagination calculation
  const totalPages = Math.ceil(sortedInvoices.length / ITEMS_PER_PAGE) || 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sortedInvoices.length);
  const paginatedInvoices = sortedInvoices.slice(startIndex, endIndex);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-card dark:bg-card text-card-foreground border border-border dark:border-border shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="p-5 border-b border-border dark:border-border flex items-start justify-between bg-muted/30 dark:bg-muted/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#8FA28A]/10 text-[#8FA28A] border border-[#8FA28A]/20">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-black text-foreground">
                  Riwayat Invoice Tagihan Penyewa
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>Penyewa: <strong className="text-foreground font-bold">{tenantName}</strong></span>
                  <span>•</span>
                  <span>{propertyName} ({unitName})</span>
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Tenant Details Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#8FA28A]/10 border border-[#8FA28A]/25 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-4 w-4 text-[#8FA28A] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">Penyewa Aktif</span>
                <span className="font-bold text-foreground block truncate">{tenantName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <Building className="h-4 w-4 text-[#8FA28A] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">Unit Kamar</span>
                <span className="font-bold text-foreground block truncate">{propertyName} • {unitName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-4 w-4 text-[#8FA28A] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">Tanggal Masuk</span>
                <span className="font-bold text-foreground block truncate">
                  {checkInDate
                    ? new Date(checkInDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Terdaftar'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-card border border-border space-y-1 min-w-0">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground block truncate">
                Total Invoice ({tenantInvoices.length})
              </span>
              <span className="text-sm sm:text-base font-black text-foreground block truncate">
                {tenantInvoices.length} Faktur
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-300 space-y-1 min-w-0">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 block truncate">
                Total Terbayar ({paidCount})
              </span>
              <span className="text-sm sm:text-base font-black block truncate">
                {formatRupiah(totalPaid)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-300 space-y-1 min-w-0">
              <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400 block truncate">
                Sisa Belum Dibayar ({unpaidCount})
              </span>
              <span className="text-sm sm:text-base font-black block truncate" title={formatRupiah(totalUnpaid)}>
                {formatRupiah(totalUnpaid)}
              </span>
            </div>
          </div>

          {/* Search Bar inside Modal */}
          {tenantInvoices.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Cari nomor invoice real, periode, atau status..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-muted/40 border border-border focus:outline-none focus:ring-2 focus:ring-[#8FA28A]"
              />
            </div>
          )}

          {/* Invoice Table / List */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground font-extrabold uppercase text-[10px] border-b border-border">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">No. Invoice & Periode</th>
                    <th className="py-3 px-4 whitespace-nowrap min-w-[160px]">Jatuh Tempo</th>
                    <th className="py-3 px-4 whitespace-nowrap">Nominal</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground space-y-2">
                        <FileText className="h-9 w-9 text-muted-foreground/60 mx-auto" />
                        <p className="text-xs font-bold text-foreground">
                          {tenantInvoices.length === 0
                            ? 'Belum ada data invoice tercatat di database untuk penyewa ini.'
                            : 'Tidak ada invoice yang sesuai dengan kata kunci pencarian.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((inv) => {
                      const dueObj = new Date(inv.dueDate);
                      const isPaid = inv.status === 'PAID';
                      const isCurrentMonth = dueObj >= currentMonthStart && dueObj <= currentMonthEnd;
                      const isPastUnpaid = dueObj < currentMonthStart && !isPaid;

                      // Highlight & Row styles
                      let rowStyle = 'hover:bg-muted/30 transition-colors';
                      if (isCurrentMonth) {
                        rowStyle = 'bg-[#8FA28A]/10 border-l-4 border-l-[#8FA28A] ring-1 ring-[#8FA28A]/30 font-semibold';
                      } else if (isPastUnpaid) {
                        rowStyle = 'bg-rose-500/10 border-l-4 border-l-rose-600 hover:bg-rose-500/15 transition-colors';
                      }

                      return (
                        <tr key={inv.id} className={rowStyle}>
                          <td className="py-3 px-4 space-y-0.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                              <span>{inv.invoiceNumber}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyInvoiceNumber(inv.invoiceNumber, inv.id)}
                                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Salin No. Invoice"
                              >
                                {copiedId === inv.id ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              {isCurrentMonth && (
                                <span className="px-2 py-0.5 rounded bg-[#8FA28A] text-white text-[9px] font-black uppercase tracking-wider ml-1">
                                  Bulan Ini
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium block">
                              {inv.periodName}
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-foreground block">
                              {dueObj.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                            {inv.paidAt && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium whitespace-nowrap">
                                Dibayar: {new Date(inv.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-black text-foreground whitespace-nowrap">
                            {formatRupiah(inv.amount)}
                          </td>

                          <td className="py-3 px-4">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white shadow-xs">
                                <CheckCircle2 className="h-3 w-3" /> LUNAS
                              </span>
                            ) : isPastUnpaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white shadow-xs animate-pulse">
                                <AlertTriangle className="h-3 w-3" /> TUNGGAKAN
                              </span>
                            ) : isCurrentMonth ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-white shadow-xs">
                                <Clock className="h-3 w-3" /> BELUM DIBAYAR
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                                <Clock className="h-3 w-3" /> BELUM DIBAYAR
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-left whitespace-nowrap">
                            <Link
                              href={`/finance?search=${encodeURIComponent(inv.invoiceNumber)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8FA28A]/15 hover:bg-[#8FA28A]/25 text-[#5e7059] dark:text-[#a8b8a4] text-xs font-bold transition-all border border-[#8FA28A]/30 hover:shadow-xs shrink-0 whitespace-nowrap"
                              title="Buka invoice ini di menu Keuangan"
                            >
                              <span>Cek Bukti</span>
                              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {sortedInvoices.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
              <span className="text-muted-foreground font-medium">
                Menampilkan <strong className="text-foreground">{startIndex + 1}</strong> - <strong className="text-foreground">{endIndex}</strong> dari <strong className="text-foreground">{sortedInvoices.length}</strong> invoice
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={validPage === 1}
                    className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                        pg === validPage
                          ? 'bg-[#8FA28A] text-white shadow-xs'
                          : 'bg-card border border-border hover:bg-muted text-foreground'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={validPage === totalPages}
                    className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
