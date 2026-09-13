"use client";

import React from "react";
import {
  X,
  Receipt,
  Building,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Phone,
  MessageSquare,
  ExternalLink,
  CreditCard,
} from "lucide-react";

export interface HousekeepingInvoiceItem {
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
    startDate?: string;
    endDate?: string;
    unit?: {
      unitNumber?: string;
      floor?: number;
      property?: {
        id?: string;
        name?: string;
        address?: string;
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

interface HousekeepingInvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: HousekeepingInvoiceItem | null;
}

export default function HousekeepingInvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
}: HousekeepingInvoiceDetailModalProps) {
  if (!isOpen || !invoice) return null;

  const propertyName = invoice.lease?.unit?.property?.name || "Properti";
  const unitNumber = invoice.lease?.unit?.unitNumber || "-";
  const unitFloor = invoice.lease?.unit?.floor;
  const tenantName =
    invoice.lease?.tenant?.fullName ||
    invoice.lease?.tenant?.user?.fullName ||
    "Penghuni Kamar";
  const tenantPhone =
    invoice.lease?.tenant?.phoneNumber ||
    invoice.lease?.tenant?.user?.phoneNumber ||
    "";
  const tenantEmail =
    invoice.lease?.tenant?.email || invoice.lease?.tenant?.user?.email || "";

  // Format currency
  const formatIDR = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Format date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // WhatsApp link generator
  const getWaLink = () => {
    if (!tenantPhone) return null;
    let clean = tenantPhone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.substring(1);

    const isOverdue = invoice.status === "OVERDUE";
    const msg = isOverdue
      ? `Halo Kak ${tenantName}, saya petugas housekeeping dari ${propertyName}. Mengingatkan untuk tagihan invoice #${invoice.invoiceNumber} (Unit ${unitNumber}) sebesar ${formatIDR(invoice.totalAmount)} yang telah melewati jatuh tempo pada ${formatDate(invoice.dueDate)}. Mohon konfirmasinya. Terima kasih.`
      : `Halo Kak ${tenantName}, saya petugas housekeeping dari ${propertyName}. Mengenai status tagihan invoice #${invoice.invoiceNumber} (Unit ${unitNumber}) sebesar ${formatIDR(invoice.totalAmount)} dengan jatuh tempo ${formatDate(invoice.dueDate)}. Jika ada kendala, mohon informasinya. Terima kasih.`;

    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  };

  const waLink = getWaLink();

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> LUNAS (PAID)
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3.5 w-3.5" /> MENUNGGAK (OVERDUE)
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600 border border-gray-200">
            DIBATALKAN (CANCELLED)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" /> MENUNGGU PEMBAYARAN (PENDING)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 md:p-8 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl lg:max-w-4xl my-auto max-h-[85vh] sm:max-h-[88vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
        {/* Header Modal */}
        <div className="shrink-0 bg-gradient-to-r from-[#242823] via-[#383E36] to-[#1C201C] px-6 py-5 sm:px-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#8FA28A]/20 text-[#8FA28A] border border-[#8FA28A]/30 shrink-0">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Rincian Invoice #{invoice.invoiceNumber}
                </h2>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Data keuangan unit properti tugas Housekeeping
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            title="Tutup Rincian"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-gray-800">
          {/* Status & Quick Action Bar */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Status Pembayaran Saat Ini
              </p>
              <div className="mt-1.5">{renderStatusBadge(invoice.status)}</div>
            </div>

            {waLink && (invoice.status === "PENDING" || invoice.status === "OVERDUE") && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-emerald-600/10 active:scale-95 transition-all shrink-0"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Mari Ingatkan!</span>
              </a>
            )}
          </div>

          {/* 2-Column Grid Layout for Large Screens */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (Unit/Tenant Info & Timeline) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Unit & Tenant Info Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Unit Info Box */}
                <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#6B7F66]">
                    <Building className="h-4 w-4" />
                    <span>Informasi Unit Properti</span>
                  </div>
                  <div className="text-xs space-y-1 pt-1">
                    <p className="font-bold text-gray-900 text-sm">{propertyName}</p>
                    <p className="text-gray-600 font-medium">
                      Kamar: <span className="font-bold text-[#6B7F66]">Unit {unitNumber}</span>
                      {unitFloor && <span className="text-gray-400"> (Lantai {unitFloor})</span>}
                    </p>
                    {invoice.lease?.rentalPeriod && (
                      <p className="text-gray-500 font-mono text-[11px]">
                        Periode: {invoice.lease.rentalPeriod}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tenant Info Box */}
                <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#6B7F66]">
                    <User className="h-4 w-4" />
                    <span>Data Penghuni Lapangan</span>
                  </div>
                  <div className="text-xs space-y-1 pt-1">
                    <p className="font-bold text-gray-900 text-sm">{tenantName}</p>
                    {tenantPhone ? (
                      <p className="text-gray-600 flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="h-3 w-3 text-gray-400" /> {tenantPhone}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">No HP tidak tersedia</p>
                    )}
                    {tenantEmail && (
                      <p className="text-gray-500 truncate text-[11px] font-mono">{tenantEmail}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Dates & Timeline */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#8FA28A]" />
                  <span>Tanggal & Waktu Transaksi</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Tanggal Diterbitkan</p>
                    <p className="font-bold text-gray-800 font-mono mt-0.5">{formatDate(invoice.createdAt)}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                    <p className="text-[10px] text-amber-700 font-bold uppercase">Jatuh Tempo</p>
                    <p className="font-black text-amber-800 font-mono mt-0.5">{formatDate(invoice.dueDate)}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase">Tanggal Pelunasan</p>
                    <p className="font-black text-emerald-800 font-mono mt-0.5">
                      {invoice.paidAt ? formatDate(invoice.paidAt) : "Belum Lunas"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Breakdown Biaya & Bukti Transfer) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Breakdown Biaya */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-[#8FA28A]" />
                  <span>Rincian Biaya Penagihan</span>
                </h4>
                <div className="space-y-2 text-xs divide-y divide-gray-100">
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-600">Sewa Unit Pokok</span>
                    <span className="font-bold text-gray-900 font-mono">{formatIDR(invoice.amount)}</span>
                  </div>

                  {Number(invoice.utilityAmount) > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-600">Biaya Utilitas (Listrik/Air/Sampah)</span>
                      <span className="font-bold text-gray-900 font-mono">{formatIDR(invoice.utilityAmount)}</span>
                    </div>
                  )}

                  {Number(invoice.penaltyAmount) > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-rose-600 font-semibold">Denda Keterlambatan</span>
                      <span className="font-black text-rose-600 font-mono">{formatIDR(invoice.penaltyAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-3 text-sm font-black text-gray-900">
                    <span>Total Tagihan Unit</span>
                    <span className="text-emerald-700 font-mono text-base">{formatIDR(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Bukti Transfer / Payment Receipt */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#8FA28A]" />
                  <span>Bukti Pembayaran / Kuitansi Digital</span>
                </h4>

                {invoice.paymentReceipt ? (
                  <div className="space-y-2">
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 max-h-56 flex items-center justify-center">
                      <img
                        src={invoice.paymentReceipt}
                        alt={`Bukti Transfer ${invoice.invoiceNumber}`}
                        className="max-h-56 object-contain"
                      />
                    </div>
                    <a
                      href={invoice.paymentReceipt}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#6B7F66] hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Buka Struk Ukuran Penuh</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center text-xs text-gray-500 space-y-1">
                    <p className="font-bold text-gray-700">Belum Ada Bukti Pembayaran</p>
                    <p className="text-[11px] text-gray-400">
                      {invoice.status === "PAID"
                        ? "Status dikonfirmasi lunas secara manual oleh pengelola."
                        : "Menunggu penghuni mengunggah struk transfer."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-2xl border border-gray-200 bg-white px-6 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer shadow-2xs"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
}
