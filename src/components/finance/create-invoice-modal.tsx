"use client";

import React, { useState, useEffect } from "react";
import {
  IconX,
  IconReceipt,
  IconBuilding,
  IconUser,
  IconCalendar,
  IconCoin,
  IconLoader2,
  IconCheck,
  IconPlus,
} from "@tabler/icons-react";

interface ActiveLease {
  leaseId: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  rentPrice: number;
  lateFeeAmount?: number;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeLeases: ActiveLease[];
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  activeLeases,
}: CreateInvoiceModalProps) {
  const [selectedLeaseId, setSelectedLeaseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState<number | "">(0);
  const [utilityAmount, setUtilityAmount] = useState<number | "">(0);
  const [penaltyAmount, setPenaltyAmount] = useState<number | "">(0);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default due date to 7 days from today
  useEffect(() => {
    if (isOpen) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDueDate(nextWeek.toISOString().split("T")[0]);
      setError(null);
    }
  }, [isOpen]);

  const handleLeaseSelect = (leaseId: string) => {
    setSelectedLeaseId(leaseId);
    const lease = activeLeases.find((l) => l.leaseId === leaseId);
    if (lease) {
      setAmount(lease.rentPrice || 0);
      setPenaltyAmount(lease.lateFeeAmount || 50000);
    }
  };

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

  const selectedLease = activeLeases.find((l) => l.leaseId === selectedLeaseId);

  const totalAmount =
    (Number(amount) || 0) + (Number(utilityAmount) || 0) + (Number(penaltyAmount) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaseId) {
      setError("Pilih penyewa & unit terlebih dahulu.");
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setError("Nominal biaya sewa tidak valid.");
      return;
    }
    if (!dueDate) {
      setError("Tanggal jatuh tempo wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const numUtility = Number(utilityAmount) || 0;
      const numPenalty = Number(penaltyAmount) || 0;

      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId: selectedLeaseId,
          amount: numAmount,
          utilityAmount: numUtility,
          penaltyAmount: numPenalty,
          dueDate,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membuat invoice tagihan baru.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem saat membuat invoice.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl text-slate-900 overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/60 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <IconReceipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Buat Invoice Tagihan Baru</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Terbitkan tagihan sewa & utilitas untuk penyewa aktif</p>
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
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 flex items-center gap-2 font-medium">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Lease Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <IconUser className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Pilih Penyewa & Unit (Lease Aktif) *
            </label>
            {activeLeases.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 font-medium">
                Tidak ada data penyewa/kontrak aktif. Buat kontrak atau pilih unit terisi terlebih dahulu.
              </div>
            ) : (
              <select
                value={selectedLeaseId}
                onChange={(e) => handleLeaseSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="">-- Pilih Unit / Penyewa --</option>
                {activeLeases.map((lease) => (
                  <option key={lease.leaseId} value={lease.leaseId}>
                    {lease.propertyName} - Unit {lease.unitNumber} ({lease.tenantName})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedLease && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 text-slate-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Properti:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedLease.propertyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Unit & Tenant:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  Unit {selectedLease.unitNumber} - {selectedLease.tenantName}
                </span>
              </div>
            </div>
          )}

          {/* Amount Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Rent Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <IconCoin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Biaya Sewa (Rp) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatDisplay(amount)}
                onChange={(e) => setAmount(parseNumber(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white font-semibold"
              />
            </div>

            {/* Utility Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                Air/Listrik/WiFi (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatDisplay(utilityAmount)}
                onChange={(e) => setUtilityAmount(parseNumber(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white font-semibold"
              />
            </div>

            {/* Penalty/Other Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                Denda / Lain (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatDisplay(penaltyAmount)}
                onChange={(e) => setPenaltyAmount(parseNumber(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white font-semibold"
              />
            </div>
          </div>

          {/* Total Preview */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 flex justify-between items-center dark:bg-emerald-950/30 dark:border-emerald-800">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Total Nominal Tagihan:</span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <IconCalendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Tanggal Jatuh Tempo *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan Tambahan (Opsional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tagihan sewa bulan September & utilitas pemakaian listrik 150 kWh"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
              disabled={loading || activeLeases.length === 0}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Menerbitkan...
                </>
              ) : (
                <>
                  <IconPlus className="h-4 w-4" />
                  Terbitkan Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
