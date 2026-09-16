'use client';

import React from 'react';
import { X, Check, ClipboardList, Trash2, KeyRound } from 'lucide-react';
import { Unit, UnitStatus } from '../../../units/_types';

interface QuickUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
  onUpdateStatus: (unitId: string, newStatus: UnitStatus) => void;
  onCheckout: (unitId: string) => void;
}

const STATUS_OPTS: { label: string; value: UnitStatus; color: string; desc: string }[] = [
  {
    label: 'Tersedia (Available)',
    value: 'Available',
    color: 'bg-[#8FA28A] text-white hover:bg-[#8FA28A]/90',
    desc: 'Kamar siap huni, bersih, dan tidak ada kerusakan.'
  },
  {
    label: 'Terisi (Occupied)',
    value: 'Occupied',
    color: 'bg-blue-600 text-white hover:bg-blue-700',
    desc: 'Kamar sedang aktif dihuni oleh penyewa.'
  },
  {
    label: 'Butuh Pembersihan (Need Cleaning)',
    value: 'Need Cleaning',
    color: 'bg-[#C8A96B] text-white hover:bg-[#C8A96B]/90',
    desc: 'Kamar kotor pasca checkout atau perlu dibersihkan berkala.'
  },
  {
    label: 'Perbaikan (Maintenance)',
    value: 'Maintenance',
    color: 'bg-red-600 text-white hover:bg-red-700',
    desc: 'Kamar sedang diperbaiki (fasilitas rusak, cat ulang, dll.).'
  }
];

export default function QuickUpdateModal({ isOpen, onClose, unit, onUpdateStatus, onCheckout }: QuickUpdateModalProps) {
  if (!isOpen || !unit) return null;

  const handleCheckout = () => {
    if (window.confirm(`Apakah Anda yakin ingin melakukan CHECKOUT cepat untuk ${unit.tenantName} dari ${unit.name}?`)) {
      onCheckout(unit.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#8FA28A]" />
            <h3 className="text-sm font-black text-foreground">Ubah Status Kamar Cepat</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Room Summary */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Kamar</span>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-foreground">{unit.name}</h4>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                unit.status === 'Available' ? 'bg-[#8FA28A] text-white' :
                unit.status === 'Occupied' ? 'bg-blue-600 text-white' :
                unit.status === 'Need Cleaning' ? 'bg-[#C8A96B] text-white' :
                'bg-red-600 text-white'
              }`}>
                {unit.status === 'Available' ? 'Tersedia' :
                 unit.status === 'Occupied' ? 'Terisi' :
                 unit.status === 'Need Cleaning' ? 'Butuh Pembersih' :
                 'Perbaikan'}
              </span>
            </div>
            {unit.tenantName && (
              <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border">
                Penyewa aktif: <strong className="text-foreground">{unit.tenantName}</strong>
              </p>
            )}
          </div>

          {/* Status Options Grid */}
          <div className="space-y-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pilih Status Baru</span>
            
            <div className="space-y-2">
              {STATUS_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateStatus(unit.id, opt.value)}
                  disabled={unit.status === opt.value}
                  className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                    unit.status === opt.value
                      ? 'border-[#8FA28A] bg-[#8FA28A]/10 shadow-sm'
                      : 'border-border bg-card hover:bg-muted/60'
                  }`}
                >
                  <div className="space-y-0.5 max-w-[85%]">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        opt.value === 'Available' ? 'bg-[#8FA28A]' :
                        opt.value === 'Occupied' ? 'bg-blue-600' :
                        opt.value === 'Need Cleaning' ? 'bg-[#C8A96B]' :
                        'bg-red-600'
                      }`} />
                      <span className="text-xs font-black text-foreground">{opt.label.split(' ')[0]}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">{opt.desc}</span>
                  </div>

                  {unit.status === opt.value && (
                    <Check className="h-4 w-4 text-[#8FA28A] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Checkout Trigger */}
          {unit.status === 'Occupied' && unit.tenantName && (
            <div className="pt-3 border-t border-border space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Manajemen Checkout Penyewa</span>
              <button
                onClick={handleCheckout}
                className="w-full rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive py-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
                Checkout Cepat (Selesai Sewa)
              </button>
              <p className="text-[9px] text-destructive/80 leading-relaxed text-center">
                *Tindakan ini akan mengosongkan kamar, menghapus data sewa penyewa, dan mengubah status kamar secara otomatis menjadi &quot;Butuh Pembersihan&quot;.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
