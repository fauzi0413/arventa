'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { UnitStatus } from '../_types';

interface UnitStatusBadgeDropdownProps {
  status: UnitStatus;
  onChange: (newStatus: UnitStatus) => void;
  disabled?: boolean;
}

const STATUS_CONFIGS: Record<string, { label: string; bg: string; text: string; border: string; dotBg: string }> = {
  Available: {
    label: 'Tersedia',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200/80',
    dotBg: 'bg-emerald-500',
  },
  AVAILABLE: {
    label: 'Tersedia',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200/80',
    dotBg: 'bg-emerald-500',
  },
  Occupied: {
    label: 'Terisi',
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200/80',
    dotBg: 'bg-blue-500',
  },
  OCCUPIED: {
    label: 'Terisi',
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200/80',
    dotBg: 'bg-blue-500',
  },
  'Need Cleaning': {
    label: 'Perlu Dibersihkan',
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200/80',
    dotBg: 'bg-amber-500',
  },
  Cleaning: {
    label: 'Perlu Dibersihkan',
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200/80',
    dotBg: 'bg-amber-500',
  },
  CLEANING: {
    label: 'Perlu Dibersihkan',
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200/80',
    dotBg: 'bg-amber-500',
  },
  Maintenance: {
    label: 'Perbaikan',
    bg: 'bg-rose-50 hover:bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-200/80',
    dotBg: 'bg-rose-500',
  },
  MAINTENANCE: {
    label: 'Perbaikan',
    bg: 'bg-rose-50 hover:bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-200/80',
    dotBg: 'bg-rose-500',
  },
  Reserved: {
    label: 'Reserved',
    bg: 'bg-purple-50 hover:bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200/80',
    dotBg: 'bg-purple-500',
  },
  RESERVED: {
    label: 'Reserved',
    bg: 'bg-purple-50 hover:bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200/80',
    dotBg: 'bg-purple-500',
  },
};

const ALL_STATUSES: UnitStatus[] = ['Available', 'Occupied', 'Need Cleaning', 'Maintenance', 'Reserved'];

export default function UnitStatusBadgeDropdown({
  status,
  onChange,
  disabled = false,
}: UnitStatusBadgeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentConfig = STATUS_CONFIGS[status] || STATUS_CONFIGS.Available;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (newStatus: UnitStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (newStatus !== status) {
      onChange(newStatus);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-2xs ${currentConfig.bg} ${currentConfig.text} ${currentConfig.border} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${currentConfig.dotBg} animate-pulse`} />
        <span>{currentConfig.label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Custom Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-44 origin-top-right rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 mb-1 border-b border-gray-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ubah Status Unit</span>
          </div>
          <div className="space-y-0.5">
            {ALL_STATUSES.map((st) => {
              const cfg = STATUS_CONFIGS[st];
              const isSelected = st === status;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={(e) => handleSelect(st, e)}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-gray-100 text-gray-900 font-extrabold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dotBg}`} />
                    <span className={cfg.text}>{cfg.label}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-gray-700" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
