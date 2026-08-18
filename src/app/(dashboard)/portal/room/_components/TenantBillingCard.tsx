'use client';

import React from 'react';
import { CreditCard, Calendar, CheckCircle2, AlertCircle, Clock, FileText, ArrowUpRight } from 'lucide-react';
import { TenantBillingSummary } from '../_types';

interface TenantBillingCardProps {
  billing?: TenantBillingSummary;
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

  // Fallback default billing data if none provided
  const activeBilling: TenantBillingSummary = billing || {
    invoiceNumber: 'INV-202608-001',
    billingMonth: 'Agustus 2026',
    monthlyRent: monthlyRent,
    utilitiesCost: 150000,
    totalAmount: monthlyRent + 150000,
    dueDate: '2026-08-25',
    paymentStatus: 'Pending',
  };

  const getStatusBadge = (status: 'Lunas' | 'Jatuh Tempo' | 'Pending') => {
    switch (status) {
      case 'Lunas':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
          label: 'Lunas',
        };
      case 'Jatuh Tempo':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertCircle className="h-3.5 w-3.5 text-red-600" />,
          label: 'Jatuh Tempo',
        };
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock className="h-3.5 w-3.5 text-amber-600" />,
          label: 'Menunggu Pembayaran',
        };
    }
  };

  const statusBadge = getStatusBadge(activeBilling.paymentStatus);

  return (
    <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-6 flex flex-col justify-between">
      <div className="space-y-5">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#8FA28A]" />
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Status Tagihan Bulanan</h3>
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${statusBadge.bg}`}>
            {statusBadge.icon}
            {statusBadge.label}
          </span>
        </div>

        {/* Invoice Period Banner */}
        <div className="bg-[#F7F4ED] rounded-xl p-4 border border-[#C7D3C0]/30 space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Periode Tagihan</span>
            <span className="font-mono text-[10px] text-gray-400 font-bold">{activeBilling.invoiceNumber}</span>
          </div>
          <p className="text-base font-black text-gray-800">{activeBilling.billingMonth}</p>
        </div>

        {/* Amount & Due Date */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500 font-bold">Total Tagihan:</span>
            <span className="text-xl font-black text-[#8FA28A]">{formatRupiah(activeBilling.totalAmount)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Calendar className="h-3.5 w-3.5 text-gray-400" /> Jatuh Tempo Pembayaran
            </span>
            <span className="font-black text-gray-800">{activeBilling.dueDate}</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 pt-2 border-t border-gray-50 text-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Rincian Komponen Biaya</span>
          <div className="space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>• Sewa Pokok Kamar</span>
              <span className="font-bold text-gray-800">{formatRupiah(activeBilling.monthlyRent)}</span>
            </div>
            {activeBilling.utilitiesCost ? (
              <div className="flex justify-between text-gray-600">
                <span>• Air, Kebersihan & Utilitas</span>
                <span className="font-bold text-gray-800">{formatRupiah(activeBilling.utilitiesCost)}</span>
              </div>
            ) : null}
            {activeBilling.depositAmount ? (
              <div className="flex justify-between text-gray-600">
                <span>• Deposit Jaminan</span>
                <span className="font-bold text-gray-800">{formatRupiah(activeBilling.depositAmount)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-gray-100">
        <a
          href="/portal/invoices"
          className="min-h-[44px] w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#8FA28A]/10 hover:bg-[#8FA28A] hover:text-white text-[#8FA28A] px-4 py-2.5 text-xs font-black transition-all shadow-sm"
        >
          <FileText className="h-4 w-4" />
          Lihat Riwayat & Instruksi Bayar
          <ArrowUpRight className="h-3.5 w-3.5 ml-auto" />
        </a>
      </div>
    </div>
  );
}
