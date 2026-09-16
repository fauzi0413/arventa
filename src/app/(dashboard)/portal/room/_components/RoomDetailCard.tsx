'use client';

import React, { useState } from 'react';
import { Bed, Compass, User, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Unit } from '@/app/(dashboard)/units/_types';
import { InventoryItem } from '@/app/(dashboard)/properties/_types';

interface RoomDetailCardProps {
  unit: Unit;
  inventories: InventoryItem[];
}

const ITEMS_PER_PAGE = 8;

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

export default function RoomDetailCard({ unit, inventories }: RoomDetailCardProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(inventories.length / ITEMS_PER_PAGE);
  const validPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = inventories.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

      {/* Daftar Inventaris Barang (Master Data Properti: Area Umum + Dalam Unit terpilih) */}
      <div className="space-y-3.5 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Package className="h-4 w-4 text-[#8FA28A]" /> Daftar Inventaris Barang
          </span>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border">
            {inventories.length} Barang
          </span>
        </div>

        {inventories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Package className="h-6 w-6 text-muted-foreground mx-auto opacity-40 mb-1.5" />
            <p className="text-xs text-muted-foreground italic">Belum ada data inventaris terdaftar untuk kamar ini.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {paginatedItems.map((item) => {
                const isCommonArea =
                  item.locationType === 'COMMON_AREA' ||
                  (item as any).category === 'Area Umum' ||
                  (item as any).location === 'Area Umum';

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card dark:bg-card shadow-2xs hover:border-[#8FA28A]/40 transition-all"
                  >
                    {/* Photo thumbnail or N/A placeholder */}
                    <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-muted/50 border border-border flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[9px] text-muted-foreground font-bold uppercase bg-muted/30">
                          N/A
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <h5 className="text-xs font-bold text-foreground truncate">{item.name}</h5>
                        <span
                          className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 ${getConditionStyle(
                            item.condition
                          )}`}
                        >
                          {item.condition || 'Baik'}
                        </span>
                      </div>

                      <span
                        className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${
                          isCommonArea
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25'
                            : 'bg-[#8FA28A]/10 text-[#8FA28A] border-[#8FA28A]/25'
                        }`}
                      >
                        {isCommonArea ? 'Area Umum' : 'Dalam Unit'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls if > 8 items */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Halaman <strong className="text-foreground">{validPage}</strong> dari {totalPages}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validPage <= 1}
                    className="h-7 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11px] cursor-pointer"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <span>Sebelumnya</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={validPage >= totalPages}
                    className="h-7 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11px] cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
