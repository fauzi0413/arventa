'use client';

import React, { useState } from 'react';
import { X, UserPlus, User, Phone, Calendar, Check, LogOut, Loader2 } from 'lucide-react';
import { Unit } from '../_types';

interface AssignTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit;
  onSaveTenant: (data: { tenantName: string; tenantPhone: string; checkInDate: string }) => void;
  onCheckoutTenant?: () => void;
}

export default function AssignTenantModal({
  isOpen,
  onClose,
  unit,
  onSaveTenant,
  onCheckoutTenant,
}: AssignTenantModalProps) {
  const [tenantName, setTenantName] = useState(unit.tenantName || '');
  const [tenantPhone, setTenantPhone] = useState(unit.tenantPhone || '');
  const [checkInDate, setCheckInDate] = useState(
    unit.checkInDate || new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) {
      alert('Nama penyewa wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      onSaveTenant({
        tenantName: tenantName.trim(),
        tenantPhone: tenantPhone.trim(),
        checkInDate,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = () => {
    if (window.confirm(`Apakah Anda yakin penyewa ${unit.tenantName} telah keluar (check-out)? Status kamar akan otomatis disesuaikan.`)) {
      if (onCheckoutTenant) onCheckoutTenant();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
      <div className="w-full max-w-md bg-card dark:bg-card text-card-foreground dark:text-card-foreground rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-border dark:border-border animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border dark:border-border px-6 py-4 bg-muted/40 dark:bg-muted/20">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#8FA28A]" />
            <div>
              <h3 className="text-base font-black text-foreground dark:text-foreground">
                {unit.tenantName ? 'Kelola Data Penyewa Kamar' : 'Tambah Penyewa Baru'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unit.name} • Tetapkan penyewa aktif untuk unit kamar ini.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-foreground dark:text-foreground mb-1.5 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-[#8FA28A]" /> Nama Lengkap Penyewa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-border dark:border-border bg-background dark:bg-background text-xs font-semibold focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground dark:text-foreground mb-1.5 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-[#8FA28A]" /> Nomor WhatsApp / Handphone
            </label>
            <input
              type="text"
              placeholder="Contoh: 081234567890"
              value={tenantPhone}
              onChange={(e) => setTenantPhone(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-border dark:border-border bg-background dark:bg-background text-xs font-semibold focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground dark:text-foreground mb-1.5 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#8FA28A]" /> Tanggal Masuk (Check-In)
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-border dark:border-border bg-background dark:bg-background text-xs font-semibold focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-border dark:border-border flex items-center justify-between gap-3">
            {unit.tenantName && onCheckoutTenant && (
              <button
                type="button"
                onClick={handleCheckout}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Check Out Penyewa
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Simpan Penyewa
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
