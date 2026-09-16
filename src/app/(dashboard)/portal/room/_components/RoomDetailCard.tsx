'use client';

import React from 'react';
import { Bed, Compass, User, Package, ShieldCheck } from 'lucide-react';
import { Unit } from '@/app/(dashboard)/units/_types';
import { InventoryItem } from '@/app/(dashboard)/properties/_types';

interface RoomDetailCardProps {
  unit: Unit;
  inventories: InventoryItem[];
}

export default function RoomDetailCard({ unit, inventories }: RoomDetailCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Bed className="h-5 w-5 text-[#8FA28A]" />
        <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Detail Kamar Anda</h3>
      </div>

      {/* Specifications */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/40 rounded-xl p-3.5 border border-border space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Compass className="h-3 w-3 text-[#8FA28A]" /> Dimensi
          </span>
          <p className="text-sm font-black text-foreground">{unit.capacity?.dimensions || '3x4 m'}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-3.5 border border-border space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <User className="h-3 w-3 text-[#8FA28A]" /> Kapasitas Maksimal
          </span>
          <p className="text-sm font-black text-foreground">{unit.capacity?.maxPersons || 1} Orang</p>
        </div>
      </div>

      {/* Facilities */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fasilitas Kamar</span>
        {unit.facilities.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Tidak ada fasilitas terdaftar.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unit.facilities.map((fac) => (
              <span
                key={fac}
                className="rounded-xl bg-[#8FA28A]/10 border border-[#8FA28A]/25 px-3 py-1 text-xs font-bold text-[#6A7866] dark:text-[#A3B89E]"
              >
                {fac}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rented Inventories */}
      <div className="space-y-3.5 pt-2 border-t border-border/50">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
          <Package className="h-4 w-4 text-[#8FA28A]" /> Daftar Inventaris Kamar
        </span>
        
        {inventories.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Belum ada data inventaris terdaftar untuk kamar ini.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {inventories.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/40">
                <span className="text-xs font-bold text-foreground truncate max-w-[70%]">{item.name}</span>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  item.condition === 'Baik'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}>
                  {item.condition}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
