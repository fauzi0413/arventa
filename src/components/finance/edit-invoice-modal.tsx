"use client";

import React, { useState, useEffect } from "react";
import {
  IconX,
  IconEdit,
  IconCalendar,
  IconCoin,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  amount: number | string;
  utilityAmount: number | string;
  penaltyAmount: number | string;
  totalAmount: number | string;
  dueDate: string;
  status: string;
  lease?: {
    unit?: {
      unitNumber?: string;
      property?: {
        name?: string;
      };
    };
    tenant?: {
      fullName?: string;
      user?: {
        fullName?: string;
      };
    };
  };
}

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: InvoiceData | null;
}

export function EditInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  invoice,
}: EditInvoiceModalProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [utilityAmount, setUtilityAmount] = useState<number | "">(0);
  const [penaltyAmount, setPenaltyAmount] = useState<number | "">(0);
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && invoice) {
      setAmount(Number(invoice.amount || 0));
      setUtilityAmount(Number(invoice.utilityAmount || 0));
      setPenaltyAmount(Number(invoice.penaltyAmount || 0));
      setDueDate(
        invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : ""
      );
      setError(null);
    }
  }, [isOpen, invoice]);

  // Format number to IDR thousand format (e.g. 1500000 -> "1.500.000")
  const formatDisplay = (val: number | string) => {
    if (val === "" || val === null || val === undefined) return "";
    const clean = String(val).replace(/\D/g, "");
    if (!clean) return "";
    return new Intl.NumberFormat("id-ID").format(Number(clean));
  };

  const parseNumber = (val: string): number | "" => {
    const clean = val.replace(/\D/g, "");
    return clean ? Number(clean) : "";
  };

  const numAmount = typeof amount === "number" ? amount : 0;
  const numUtility = typeof utilityAmount === "number" ? utilityAmount : 0;
  const numPenalty = typeof penaltyAmount === "number" ? penaltyAmount : 0;
  const totalAmount = numAmount + numUtility + numPenalty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    if (numAmount < 0) {
      setError("Nominal sewa tidak boleh negatif.");
      return;
    }
    if (!dueDate) {
      setError("Pilih tanggal jatuh tempo tagihan.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/finance/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          utilityAmount: numUtility,
          penaltyAmount: numPenalty,
          dueDate,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui invoice.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem saat memperbarui invoice.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  const propertyName = invoice.lease?.unit?.property?.name || "Properti";
  const unitNumber = invoice.lease?.unit?.unitNumber || "-";
  const tenantName =
    invoice.lease?.tenant?.fullName ||
    invoice.lease?.tenant?.user?.fullName ||
    "Penyewa";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl text-slate-900 overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/60 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
              <IconEdit className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Edit Rincian Invoice</h3>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Info Banner */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 text-slate-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Properti & Unit:</span>
              <span className="font-bold text-slate-900 dark:text-white">{propertyName} (Unit {unitNumber})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Nama Penyewa:</span>
              <span className="font-bold text-slate-900 dark:text-white">{tenantName}</span>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <IconCoin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Nominal Sewa (Rp) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatDisplay(amount)}
                onChange={(e) => setAmount(parseNumber(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nominal Air / Listrik / WiFi (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatDisplay(utilityAmount)}
                onChange={(e) => setUtilityAmount(parseNumber(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nominal Denda / Biaya Tambahan (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatDisplay(penaltyAmount)}
                onChange={(e) => setPenaltyAmount(parseNumber(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white font-semibold"
              />
            </div>
          </div>

          {/* Total Preview */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 flex justify-between items-center dark:bg-blue-950/30 dark:border-blue-800">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300">Total Tagihan Baru:</span>
            <span className="text-lg font-black text-blue-700 dark:text-blue-400">
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <IconCalendar className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Tanggal Jatuh Tempo *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

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
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
