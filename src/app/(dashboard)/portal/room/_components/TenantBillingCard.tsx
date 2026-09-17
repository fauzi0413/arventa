'use client';

import React from 'react';
import { CreditCard, Calendar, CheckCircle2, AlertCircle, Clock, FileText, ArrowUpRight } from 'lucide-react';
import { TenantBillingSummary } from '../_types';

interface TenantBillingCardProps {
  billing?: TenantBillingSummary | null;
  monthlyRent: number;
}

export default function TenantBillingCard({ billing, monthlyRent }: TenantBillingCardProps) {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (!billing) {
    return (
      <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-6 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#8FA28A]" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Status Tagihan Bulanan</h3>
            </div>
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground bg-muted/40 uppercase tracking-wider">
              Tidak Ada Tagihan
            </span>
          </div>

          {/* Empty State Banner */}
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <CreditCard className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-foreground">Belum Ada Tagihan Aktif</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tidak ada tagihan yang harus dibayar saat ini. Tagihan sewa akan terbit otomatis saat unit terisi penyewa dan memiliki kontrak sewa aktif.
            </p>
          </div>
        </div>

        {/* Disabled Action Footer */}
        <div className="pt-2 border-t border-border/50 text-center">
          <span className="text-[11px] text-muted-foreground italic">Semua tagihan lunas atau belum diterbitkan</span>
        </div>
      </div>
    );
  }

  const activeBilling = billing;

  const getStatusBadge = (status: 'Lunas' | 'Jatuh Tempo' | 'Pending') => {
    switch (status) {
      case 'Lunas':
        return {
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
          label: 'Lunas',
        };
      case 'Jatuh Tempo':
        return {
          bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          icon: <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />,
          label: 'Jatuh Tempo',
        };
      default:
        return {
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          icon: <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
          label: 'Menunggu Pembayaran',
        };
    }
  };

  const statusBadge = getStatusBadge(activeBilling.paymentStatus);

  return (
    <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-6 flex flex-col justify-between">
      <div className="space-y-5">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#8FA28A]" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Status Tagihan Bulanan</h3>
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${statusBadge.bg}`}>
            {statusBadge.icon}
            {statusBadge.label}
          </span>
        </div>

        {/* Invoice Period Banner */}
        <div className="bg-muted/40 rounded-xl p-4 border border-border space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-wider">Periode Tagihan</span>
            <span className="font-mono text-[10px] text-muted-foreground font-bold">{activeBilling.invoiceNumber}</span>
          </div>
          <p className="text-base font-black text-foreground">{activeBilling.billingMonth}</p>
        </div>

        {/* Amount & Due Date */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground font-bold">Total Tagihan:</span>
            <span className="text-xl font-black text-[#8FA28A]">{formatRupiah(activeBilling.totalAmount)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border">
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" /> Jatuh Tempo Pembayaran
            </span>
            <span className="font-black text-foreground">{activeBilling.dueDate}</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Rincian Komponen Biaya</span>
          <div className="space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <span>• Sewa Pokok Kamar</span>
              <span className="font-bold text-foreground">{formatRupiah(activeBilling.monthlyRent)}</span>
            </div>
            {activeBilling.utilitiesCost ? (
              <div className="flex justify-between text-muted-foreground">
                <span>• Air, Kebersihan & Utilitas</span>
                <span className="font-bold text-foreground">{formatRupiah(activeBilling.utilitiesCost)}</span>
              </div>
            ) : null}
            {activeBilling.depositAmount ? (
              <div className="flex justify-between text-muted-foreground">
                <span>• Deposit Jaminan</span>
                <span className="font-bold text-foreground">{formatRupiah(activeBilling.depositAmount)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-border">
        <a
          href="/portal/invoices"
          className="min-h-[44px] w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#8FA28A]/10 hover:bg-[#8FA28A] hover:text-white text-[#8FA28A] dark:text-[#A3B89E] dark:hover:text-white px-4 py-2.5 text-xs font-black transition-all shadow-sm"
        >
          <FileText className="h-4 w-4" />
          Lihat Riwayat & Instruksi Bayar
          <ArrowUpRight className="h-3.5 w-3.5 ml-auto" />
        </a>
      </div>
    </div>
  );
}
