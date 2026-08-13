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
    <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Bed className="h-5 w-5 text-[#8FA28A]" />
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Detail Kamar Anda</h3>
      </div>

      {/* Specifications */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#F7F4ED] rounded-xl p-3.5 border border-[#C7D3C0]/25 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <Compass className="h-3 w-3 text-[#8FA28A]" /> Dimensi
          </span>
          <p className="text-sm font-black text-gray-800">{unit.capacity?.dimensions || '3x4 m'}</p>
        </div>
        <div className="bg-[#F7F4ED] rounded-xl p-3.5 border border-[#C7D3C0]/25 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <User className="h-3 w-3 text-[#8FA28A]" /> Kapasitas Maksimal
          </span>
          <p className="text-sm font-black text-gray-800">{unit.capacity?.maxPersons || 1} Orang</p>
        </div>
      </div>

      {/* Facilities */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Fasilitas Kamar</span>
        {unit.facilities.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Tidak ada fasilitas terdaftar.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unit.facilities.map((fac) => (
              <span
                key={fac}
                className="rounded-xl bg-[#C7D3C0]/15 border border-[#C7D3C0]/35 px-3 py-1 text-xs font-bold text-[#6A7866]"
              >
                {fac}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rented Inventories */}
      <div className="space-y-3.5 pt-2 border-t border-gray-50">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
          <Package className="h-4 w-4 text-[#8FA28A]" /> Daftar Inventaris Kamar
        </span>
        
        {inventories.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Belum ada data inventaris terdaftar untuk kamar ini.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {inventories.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/50">
                <span className="text-xs font-bold text-gray-700 truncate max-w-[70%]">{item.name}</span>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  item.condition === 'Baik'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
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
