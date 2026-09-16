'use client';

import React, { useState } from 'react';
import { X, ArrowLeftRight, ShieldAlert, Check } from 'lucide-react';
import { Unit } from '../../../units/_types';
import { Property } from '../../../properties/_types';

interface RoomTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceUnit: Unit | null;
  availableUnits: Unit[];
  properties: Property[];
  onTransfer: (sourceUnitId: string, targetUnitId: string) => void;
}

export default function RoomTransferModal({
  isOpen,
  onClose,
  sourceUnit,
  availableUnits,
  properties,
  onTransfer
}: RoomTransferModalProps) {
  const [targetUnitId, setTargetUnitId] = useState('');

  if (!isOpen || !sourceUnit) return null;

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUnitId) {
      alert('Silakan pilih kamar tujuan terlebih dahulu.');
      return;
    }

    const targetUnit = availableUnits.find((u) => u.id === targetUnitId);
    if (!targetUnit) return;

    if (
      window.confirm(
        `Apakah Anda yakin ingin memindahkan ${sourceUnit.tenantName} dari ${sourceUnit.name} ke ${targetUnit.name}?`
      )
    ) {
      onTransfer(sourceUnit.id, targetUnitId);
      setTargetUnitId('');
      onClose();
    }
  };

  const getPropName = (propId: string) => {
    return properties.find((p) => p.id === propId)?.name || 'Properti Lain';
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-[#8FA28A]" />
            <h3 className="text-sm font-black text-foreground">Transfer Kamar Penghuni</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleTransferSubmit} className="p-5 space-y-4">
          
          {/* Source Room (From) */}
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Pindah Dari (Kamar Asal)</span>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-foreground">{sourceUnit.name}</h4>
              <span className="text-[10px] text-muted-foreground font-bold">{getPropName(sourceUnit.propertyId)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border">
              Penghuni: <strong className="text-foreground">{sourceUnit.tenantName}</strong> ({sourceUnit.tenantPhone})
            </p>
          </div>

          <div className="flex justify-center py-1">
            <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4 text-[#8FA28A] transform rotate-90" />
            </div>
          </div>

          {/* Target Room (To) Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">Pilih Kamar Tujuan (Kamar Kosong)</label>
            
            {availableUnits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-destructive/30 bg-destructive/10 p-4 text-center text-xs text-destructive space-y-1">
                <ShieldAlert className="h-5 w-5 mx-auto" />
                <p className="font-bold">Tidak Ada Kamar Kosong</p>
                <p className="text-[10px] opacity-80">
                  Tidak ada unit kamar lain yang berstatus &quot;Available (Tersedia)&quot; saat ini untuk menerima pemindahan.
                </p>
              </div>
            ) : (
              <select
                value={targetUnitId}
                onChange={(e) => setTargetUnitId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background text-foreground px-3.5 py-3 text-xs focus:border-[#8FA28A] focus:outline-none transition-all font-semibold"
                required
              >
                <option value="">-- Pilih Kamar Kosong --</option>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} - {getPropName(u.propertyId)} ({formatRupiah(u.pricing.monthly)}/bln)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Warnings and Notes */}
          {targetUnitId && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 space-y-1.5 text-[10px] text-muted-foreground leading-relaxed">
              <div className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                Catatan Pemindahan Kamar
              </div>
              <ul className="list-disc pl-3.5 space-y-0.5">
                <li>Seluruh data penyewa (Nama, HP, Tanggal Masuk) akan dipindahkan ke kamar baru.</li>
                <li>Kamar asal ({sourceUnit.name}) akan diubah statusnya menjadi <strong>&quot;Need Cleaning&quot;</strong> agar segera dibersihkan.</li>
                <li>Kamar tujuan akan otomatis berstatus <strong>&quot;Occupied (Terisi)&quot;</strong>.</li>
              </ul>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={availableUnits.length === 0 || !targetUnitId}
            className="w-full rounded-xl bg-[#8FA28A] disabled:bg-muted disabled:text-muted-foreground disabled:border-transparent disabled:cursor-not-allowed hover:bg-[#8FA28A]/90 text-white py-3 text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Konfirmasi Pindah Kamar
          </button>
        </form>
      </div>
    </div>
  );
}
