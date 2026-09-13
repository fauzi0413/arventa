'use client';

import React, { useEffect } from 'react';
import {
  IconSparkles,
  IconChecklist,
  IconClock,
  IconMailCheck,
  IconX,
  IconInfoCircle,
  IconAlertTriangle,
} from '@tabler/icons-react';

export interface AutoBillingResult {
  overdueUpdatedCount: number;
  invoicesGeneratedCount: number;
  remindersSentCount: number;
}

export interface AutoBillingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AutoBillingResult | null;
  error?: string | null;
}

export function AutoBillingResultModal({
  isOpen,
  onClose,
  result,
  error,
}: AutoBillingResultModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isError = Boolean(error);
  const totalProcessed = (result?.overdueUpdatedCount || 0) + 
                         (result?.invoicesGeneratedCount || 0) + 
                         (result?.remindersSentCount || 0);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-7 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-all"
          title="Tutup"
        >
          <IconX className="h-5 w-5" />
        </button>

        {/* Header Icon */}
        <div className="mx-auto mb-4 flex items-center justify-center">
          {isError ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 shadow-md shadow-rose-500/10 ring-8 ring-rose-100 dark:bg-rose-950/50 dark:border-rose-800 dark:ring-rose-950">
              <IconAlertTriangle className="h-8 w-8" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-md shadow-emerald-500/10 ring-8 ring-emerald-100 dark:bg-emerald-950/50 dark:border-emerald-800 dark:ring-emerald-950">
              <IconSparkles className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-center text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {isError ? 'Gagal Menjalankan Auto Billing' : 'Auto Billing Selesai!'}
        </h3>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isError
            ? 'Terjadi kendala saat memproses tagihan otomatis.'
            : 'Proses sinkronisasi tagihan otomatis H-7 dan penalti keterlambatan telah diproses.'}
        </p>

        {/* Error View */}
        {isError && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-900/50 p-4 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
            {error}
          </div>
        )}

        {/* Success / Result View */}
        {!isError && result && (
          <div className="mt-5 space-y-3">
            {/* Metric Items */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Overdue */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                    <IconClock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                      Overdue Diperbarui
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Status invoice lewat jatuh tempo
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {result.overdueUpdatedCount} <span className="text-xs font-normal text-slate-500">tagihan</span>
                </span>
              </div>

              {/* Invoices Generated */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                    <IconChecklist className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                      Invoice H-7 Dibuat
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tagihan sewa 7 hari ke depan
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {result.invoicesGeneratedCount} <span className="text-xs font-normal text-slate-500">invoice</span>
                </span>
              </div>

              {/* Email Reminders */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <IconMailCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                      Email Reminder Terkirim
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Notifikasi penagihan ke penyewa
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {result.remindersSentCount} <span className="text-xs font-normal text-slate-500">email</span>
                </span>
              </div>
            </div>

            {/* Explanatory banner */}
            {totalProcessed === 0 ? (
              <div className="rounded-2xl border border-blue-200/80 bg-blue-50/80 dark:bg-blue-950/30 dark:border-blue-900/50 p-3.5 flex items-start gap-2.5">
                <IconInfoCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  <span className="font-bold">Kenapa hasilnya 0?</span>
                  <p className="mt-0.5 text-[11px] text-blue-700 dark:text-blue-400">
                    Seluruh tagihan dan kontrak sewa Anda saat ini <strong className="font-semibold">sudah 100% mutakhir</strong>. Tidak ada invoice baru yang memasuki jadwal H-7 hari ini, dan tidak ada tagihan pending yang baru melewati jatuh tempo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 dark:bg-emerald-950/30 dark:border-emerald-900/50 p-3.5 flex items-start gap-2.5">
                <IconInfoCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  <span className="font-bold">Berhasil Diperbarui</span>
                  <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                    Sistem telah memperbarui status tagihan dan mengirimkan notifikasi penagihan ke penyewa terkait.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-4 text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default AutoBillingResultModal;
