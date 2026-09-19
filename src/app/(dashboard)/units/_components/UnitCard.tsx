'use client';

import React from 'react';
import Link from 'next/link';
import { Edit3, Trash2, ArrowRight, Maximize2, Users, Receipt, UserCheck, Check } from 'lucide-react';
import { Unit, UnitStatus } from '../_types';
import UnitStatusBadgeDropdown from './UnitStatusBadgeDropdown';

interface UnitCardProps {
  unit: Unit;
  propertyName: string;
  onDelete?: (id: string) => void;
  onStatusChange?: (unitId: string, newStatus: UnitStatus) => void;
}

export default function UnitCard({
  unit,
  propertyName,
  onDelete,
  onStatusChange,
}: UnitCardProps) {
  // Format prices to Indonesian Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const targetDetailUrl = unit.propertyId
    ? `/properties/${unit.propertyId}/units/${unit.id}`
    : `/units/${unit.id}`;

  return (
    <div className="group rounded-2xl border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-5 shadow-sm transition-all duration-300 hover:shadow-md relative flex flex-col justify-between h-full border-border dark:border-border hover:border-[#8FA28A]/50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-foreground dark:text-foreground line-clamp-1 group-hover:text-[#8FA28A] transition-colors">
              {unit.name}
            </h4>
            <p className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground mt-0.5 line-clamp-1">
              {propertyName}
            </p>
          </div>

          <UnitStatusBadgeDropdown
            status={unit.status}
            onChange={(newStatus) => onStatusChange && onStatusChange(unit.id, newStatus)}
            disabled={!onStatusChange}
          />
        </div>

        {/* Pricing Detail Indicator */}
        <div className="flex items-center justify-between gap-1 bg-muted/50 dark:bg-muted/40 rounded-xl p-2.5 border border-border dark:border-border">
          <div className="flex items-center gap-1.5">
            <Receipt className="h-4 w-4 text-[#8FA28A] shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-black text-foreground dark:text-foreground leading-tight">
                {unit.pricing.yearly && unit.pricing.billingScheme === 'yearly'
                  ? formatRupiah(unit.pricing.yearly)
                  : formatRupiah(unit.pricing.monthly)}
                <span className="text-[10px] font-bold text-muted-foreground ml-0.5">
                  {unit.pricing.yearly && unit.pricing.billingScheme === 'yearly' ? '/thn' : '/bln'}
                </span>
              </span>
              {unit.pricing.yearly && unit.pricing.billingScheme === 'yearly' && unit.pricing.monthly > 0 && (
                <span className="text-[10px] font-medium text-muted-foreground">
                  ≈ {formatRupiah(unit.pricing.monthly)}/bln
                </span>
              )}
            </div>
          </div>
          {unit.roomEmail && (
            <span className="text-[10px] font-bold text-[#8FA28A] bg-[#8FA28A]/10 px-2 py-0.5 rounded-md shrink-0">
              1 Kamar 1 Akun
            </span>
          )}
        </div>

        {/* Capacity & Dimensions */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground dark:text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Max {typeof unit.capacity === 'object' && unit.capacity !== null ? (typeof unit.capacity.maxPersons === 'object' ? 1 : unit.capacity.maxPersons || 1) : (unit.capacity || 1)} Orang</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground dark:text-muted-foreground">
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{typeof unit.capacity === 'object' && unit.capacity !== null ? (unit.capacity.dimensions || '3x4 m') : '3x4 m'}</span>
          </div>
        </div>

        {/* Predefined facilities list */}
        {unit.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {unit.facilities.slice(0, 3).map((fac) => (
              <span
                key={fac}
                className="rounded-lg bg-muted dark:bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-foreground dark:text-foreground border border-border dark:border-border"
              >
                {fac}
              </span>
            ))}
            {unit.facilities.length > 3 && (
              <span className="rounded-lg bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                +{unit.facilities.length - 3} Lainnya
              </span>
            )}
          </div>
        )}

        {/* Tenant Active tag */}
        {unit.status === 'Occupied' && unit.tenantName && (
          <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 p-2 text-xs border border-blue-500/30 text-blue-600 dark:text-blue-400">
            <UserCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold truncate">Penyewa: {unit.tenantName}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-border dark:border-border flex items-center justify-between">
        <div>
          {onDelete && (
            <button
              disabled={unit.status === 'Occupied'}
              onClick={() => unit.status !== 'Occupied' && onDelete(unit.id)}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
                unit.status === 'Occupied'
                  ? 'text-muted-foreground/30 cursor-not-allowed opacity-40 hover:bg-transparent'
                  : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer'
              }`}
              title={unit.status === 'Occupied' ? 'Unit sedang terisi oleh penyewa, tidak dapat dihapus' : 'Hapus Unit'}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <Link
          href={targetDetailUrl}
          className="flex items-center gap-1 rounded-xl bg-[#8FA28A]/10 text-[#8FA28A] hover:bg-[#8FA28A] hover:text-white px-3.5 py-2 text-xs font-bold transition-all shadow-sm hover:shadow min-h-[44px]"
        >
          Detail
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
