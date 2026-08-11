'use client';

import React from 'react';
import Link from 'next/link';
import { Edit3, Trash2, ArrowRight, Maximize2, Users, Receipt, UserCheck } from 'lucide-react';
import { Unit, UnitStatus } from '../_types';

interface UnitCardProps {
  unit: Unit;
  propertyName: string;
  onEdit: (unit: Unit) => void;
  onDelete: (id: string) => void;
}

export default function UnitCard({
  unit,
  propertyName,
  onEdit,
  onDelete,
}: UnitCardProps) {
  // Format prices beautifully to Indonesian Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusStyle = (status: UnitStatus) => {
    switch (status) {
      case 'Available':
        return { bg: 'bg-[#8FA28A]/10 text-[#8FA28A] border-[#8FA28A]/30', label: 'Tersedia' };
      case 'Occupied':
        return { bg: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Terisi' };
      case 'Need Cleaning':
        return { bg: 'bg-[#C8A96B]/10 text-[#C8A96B] border-[#C8A96B]/30', label: 'Perlu Dibersihkan' };
      case 'Maintenance':
        return { bg: 'bg-red-50 text-red-600 border-red-200', label: 'Perbaikan' };
      default:
        return { bg: 'bg-gray-50 text-gray-500 border-gray-200', label: 'Tidak Diketahui' };
    }
  };

  const statusStyle = getStatusStyle(unit.status);

  return (
    <div className="group rounded-2xl border border-[#C7D3C0]/40 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#8FA28A]/50 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Card Header (Unit Name & Status Badge) */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-base font-bold text-gray-800 line-clamp-1 group-hover:text-[#8FA28A] transition-colors">
              {unit.name}
            </h4>
            <p className="text-[11px] font-semibold text-gray-400 mt-0.5 line-clamp-1">{propertyName}</p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusStyle.bg}`}
          >
            {statusStyle.label}
          </span>
        </div>

        {/* Pricing Detail Indicator */}
        <div className="flex items-center gap-1 bg-[#F7F4ED] rounded-xl p-2.5 border border-[#C7D3C0]/25">
          <Receipt className="h-4 w-4 text-[#8FA28A]" />
          <span className="text-sm font-black text-gray-700">
            {formatRupiah(unit.pricing.monthly)}
            <span className="text-[10px] font-bold text-gray-400">/bln</span>
          </span>
        </div>

        {/* Capacity & Dimensions */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span>Max {unit.capacity.maxPersons} Orang</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <Maximize2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span>{unit.capacity.dimensions}</span>
          </div>
        </div>

        {/* Predefined facilities list */}
        {unit.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {unit.facilities.slice(0, 3).map((fac) => (
              <span
                key={fac}
                className="rounded-lg bg-[#C7D3C0]/20 px-2 py-0.5 text-[10px] font-semibold text-[#6A7866] border border-[#C7D3C0]/35"
              >
                {fac}
              </span>
            ))}
            {unit.facilities.length > 3 && (
              <span className="rounded-lg bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                +{unit.facilities.length - 3} Lainnya
              </span>
            )}
          </div>
        )}

        {/* Tenant Active tag */}
        {unit.status === 'Occupied' && unit.tenantName && (
          <div className="flex items-center gap-1.5 rounded-lg bg-blue-50/60 p-2 text-xs border border-blue-100 text-blue-700">
            <UserCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold truncate">Penyewa: {unit.tenantName}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(unit)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Edit Unit"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(unit.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Hapus Unit"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <Link
          href={`/units/${unit.id}`}
          className="flex items-center gap-1 rounded-xl bg-[#8FA28A]/10 text-[#8FA28A] hover:bg-[#8FA28A] hover:text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm hover:shadow"
        >
          Detail
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
