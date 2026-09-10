"use client";

import React, { useState, useEffect } from "react";
import {
  IconX,
  IconChecklist,
  IconLoader2,
  IconCheck,
  IconReceipt,
  IconCalendar,
} from "@tabler/icons-react";
import { InvoiceStatus } from "@/types/finance";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number | string;
  paymentReceipt?: string | null;
  paidAt?: string | null;
}

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: InvoiceData | null;
}

export function UpdateStatusModal({
  isOpen,
  onClose,
  onSuccess,
  invoice,
}: UpdateStatusModalProps) {
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.PENDING);
  const [paymentReceipt, setPaymentReceipt] = useState("");
  const [paidAt, setPaidAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && invoice) {
      setStatus(invoice.status as InvoiceStatus);
      setPaymentReceipt(invoice.paymentReceipt || "");
      setPaidAt(
        invoice.paidAt
          ? new Date(invoice.paidAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setError(null);
    }
  }, [isOpen, invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/finance/invoices/${invoice.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentReceipt: paymentReceipt || null,
          paidAt: status === InvoiceStatus.PAID ? paidAt : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengubah status invoice.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem saat menguji status.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl text-slate-900 overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/60 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              <IconChecklist className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Ubah Status Invoice</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Invoice #{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Status Baru *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus(InvoiceStatus.PENDING)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all ${
                  status === InvoiceStatus.PENDING
                    ? "border-amber-300 bg-amber-100 text-amber-800 shadow-sm dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                    : "border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                PENDING (Menunggu)
              </button>

              <button
                type="button"
                onClick={() => setStatus(InvoiceStatus.PAID)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all ${
                  status === InvoiceStatus.PAID
                    ? "border-emerald-300 bg-emerald-100 text-emerald-800 shadow-sm dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                    : "border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                PAID (Lunas)
              </button>

              <button
                type="button"
                onClick={() => setStatus(InvoiceStatus.OVERDUE)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all ${
                  status === InvoiceStatus.OVERDUE
                    ? "border-rose-300 bg-rose-100 text-rose-800 shadow-sm dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                    : "border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                OVERDUE (Menunggak)
              </button>

              <button
                type="button"
                onClick={() => setStatus(InvoiceStatus.CANCELLED)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all ${
                  status === InvoiceStatus.CANCELLED
                    ? "border-slate-300 bg-slate-200 text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                    : "border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-slate-500" />
                CANCELLED (Batal)
              </button>
            </div>
          </div>

          {/* Conditional inputs if status is PAID */}
          {status === InvoiceStatus.PAID && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <IconCalendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Tanggal Pembayaran Lunas
                </label>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <IconReceipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Link / Catatan Bukti Pembayaran (Opsional)
                </label>
                <input
                  type="text"
                  value={paymentReceipt}
                  onChange={(e) => setPaymentReceipt(e.target.value)}
                  placeholder="https://... atau Transfer BCA Ref #91823"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Mengubah...
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4" />
                  Simpan Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
