'use client';

import React from 'react';
import { Bed, Compass, User, Package } from 'lucide-react';
import { Unit } from '@/app/(dashboard)/units/_types';
import { InventoryItem } from '@/app/(dashboard)/properties/_types';
import FacilityIcon from '@/components/common/FacilityIcon';

const getConditionStyle = (cond?: string) => {
  const c = (cond || '').toUpperCase();
  if (c === 'BAIK' || c === 'GOOD') {
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
  }
  if (c === 'PERLU PERBAIKAN' || c === 'NEED_REPAIR' || c === 'RUSAK RINGAN') {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
  }
  if (c === 'RUSAK BERAT' || c === 'DAMAGED') {
    return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25';
  }
  return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
};

interface RoomDetailCardProps {
  unit: Unit;
  inventories: InventoryItem[];
}

export default function RoomDetailCard({ unit, inventories }: RoomDetailCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-5 flex flex-col justify-between">
      {/* Title & Count Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-[#8FA28A]" />
          <h4 className="text-sm font-bold text-foreground">Fasilitas & Inventaris Kamar</h4>
        </div>
        {inventories.length > 0 && (
          <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border shrink-0">
            {inventories.length} Item
          </span>
        )}
      </div>

      <div className="space-y-4 flex-1">
        {/* Unit Basic Specs */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-xl border border-border text-center">
          <div>
            <span className="text-[10px] text-muted-foreground block">Tipe / Dimensi</span>
            <span className="text-xs font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
              <Bed className="h-3.5 w-3.5 text-[#8FA28A]" />
              {unit.capacity?.dimensions || '3 x 4 m'}
            </span>
          </div>
          <div className="border-x border-border">
            <span className="text-[10px] text-muted-foreground block">Kapasitas</span>
            <span className="text-xs font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
              <User className="h-3.5 w-3.5 text-[#8FA28A]" />
              {unit.capacity?.maxPersons || 1} Orang
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Posisi Kamar</span>
            <span className="text-xs font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
              <Compass className="h-3.5 w-3.5 text-[#8FA28A]" />
              Lantai 1
            </span>
          </div>
        </div>

        {inventories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Package className="h-6 w-6 text-muted-foreground mx-auto opacity-40 mb-1.5" />
            <p className="text-xs text-muted-foreground italic">Belum ada data inventaris terdaftar untuk kamar ini.</p>
          </div>
        ) : (
          <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
            {inventories.map((item) => {
              const isCommonArea =
                item.locationType === 'COMMON_AREA' ||
                (item as any).category === 'Area Umum' ||
                (item as any).location === 'Area Umum';

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border bg-card dark:bg-card shadow-2xs hover:border-[#8FA28A]/40 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Photo thumbnail or FacilityIcon */}
                    <div
                      className={`h-9 w-9 shrink-0 rounded-lg overflow-hidden flex items-center justify-center border ${
                        isCommonArea
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-[#8FA28A]/10 text-[#8FA28A] border-[#8FA28A]/20'
                      }`}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <FacilityIcon name={item.name} className="h-4 w-4" />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-xs font-bold text-foreground truncate">{item.name}</h5>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${
                            isCommonArea
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25'
                              : 'bg-[#8FA28A]/10 text-[#8FA28A] border-[#8FA28A]/25'
                          }`}
                        >
                          {isCommonArea ? 'Area Umum' : 'Dalam Unit'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Fasilitas {isCommonArea ? 'Bersama Properti' : 'Kamar Unit'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${getConditionStyle(
                      item.condition
                    )}`}
                  >
                    {item.condition || 'Baik'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
