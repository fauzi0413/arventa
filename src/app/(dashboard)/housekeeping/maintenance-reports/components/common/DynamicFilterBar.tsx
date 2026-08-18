'use client';

import React from 'react';
import { Search, Filter, RotateCcw, Calendar } from 'lucide-react';
import { Property } from '@/app/(dashboard)/properties/_types';
import { ReportFilterState } from '../../types';

interface DynamicFilterBarProps {
  filters: ReportFilterState;
  onFilterChange: (updates: Partial<ReportFilterState>) => void;
  properties: Property[];
  activeTab: 'HOUSEKEEPING' | 'MAINTENANCE' | 'HISTORY';
}

export default function DynamicFilterBar({
  filters,
  onFilterChange,
  properties,
  activeTab,
}: DynamicFilterBarProps) {
  const handleReset = () => {
    onFilterChange({
      search: '',
      housekeepingStatus: 'ALL',
      serviceType: 'ALL',
      maintenanceStatus: 'ALL',
      priority: 'ALL',
      costLiability: 'ALL',
      propertyId: 'ALL',
      ratingStatus: 'ALL',
      startDate: '',
      endDate: '',
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      {/* Upper Row: Search & Property Filter */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'HOUSEKEEPING'
                ? 'Cari tiket kebersihan, nomor unit, atau nama penyewa...'
                : activeTab === 'MAINTENANCE'
                ? 'Cari laporan kerusakan, fasilitas, atau teknisi...'
                : 'Cari seluruh riwayat laporan, unit, penyewa, atau kata kunci...'
            }
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-xs font-medium text-gray-800 focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Global Property Filter */}
        <select
          value={filters.propertyId}
          onChange={(e) => onFilterChange({ propertyId: e.target.value })}
          className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 focus:border-[#8FA28A] focus:outline-none"
        >
          <option value="ALL">Semua Properti</option>
          {properties.map((prop) => (
            <option key={prop.id} value={prop.id}>
              {prop.name}
            </option>
          ))}
        </select>

        {/* Rating Filter */}
        <select
          value={filters.ratingStatus}
          onChange={(e) => onFilterChange({ ratingStatus: e.target.value as any })}
          className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 focus:border-[#8FA28A] focus:outline-none"
        >
          <option value="ALL">Semua Status Rating</option>
          <option value="RATED">Sudah Dinilai (Rated)</option>
          <option value="UNRATED">Belum Dinilai (Unrated)</option>
        </select>

        <button
          type="button"
          onClick={handleReset}
          className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
          title="Reset Filter"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Adaptive Tab-Specific Filter Row */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-gray-100">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Filter className="h-3 w-3" /> Filter Adaptif:
        </span>

        {activeTab === 'HOUSEKEEPING' && (
          <>
            {/* Housekeeping Status */}
            <select
              value={filters.housekeepingStatus}
              onChange={(e) => onFilterChange({ housekeepingStatus: e.target.value as any })}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:border-[#8FA28A] focus:outline-none"
            >
              <option value="ALL">Semua Status Kebersihan</option>
              <option value="REQUESTED">Baru Diajukan (Requested)</option>
              <option value="ASSIGNED">Petugas Ditugaskan</option>
              <option value="IN_CLEANING">Sedang Dibersihkan (In Cleaning)</option>
              <option value="COMPLETED">Selesai (Completed)</option>
              <option value="CLOSED">Selesai & Ditutup</option>
            </select>

            {/* Service Type */}
            <select
              value={filters.serviceType}
              onChange={(e) => onFilterChange({ serviceType: e.target.value as any })}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:border-[#8FA28A] focus:outline-none"
            >
              <option value="ALL">Semua Jenis Layanan</option>
              <option value="DAILY_CLEAN">Daily Clean (Pembersihan Harian)</option>
              <option value="DEEP_CLEAN">Deep Clean (Pembersihan Total)</option>
              <option value="LINEN_CHANGE">Linen Change (Ganti Sprei)</option>
              <option value="CHECKOUT_CLEAN">Checkout Clean (Selesai Sewa)</option>
            </select>
          </>
        )}

        {(activeTab === 'MAINTENANCE' || activeTab === 'HISTORY') && (
          <>
            {/* Maintenance Status */}
            <select
              value={filters.maintenanceStatus}
              onChange={(e) => onFilterChange({ maintenanceStatus: e.target.value as any })}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:border-[#8FA28A] focus:outline-none"
            >
              <option value="ALL">Semua Status Kerusakan</option>
              <option value="REPORTED">Baru Dilaporkan (Reported)</option>
              <option value="IN_PROGRESS">Dalam Perbaikan (In Progress)</option>
              <option value="RESOLVED">Selesai Diperbaiki (Resolved)</option>
              <option value="CLOSED">Ditutup Resmi</option>
            </select>

            {/* Urgency / Emergency Level Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange({ priority: e.target.value as any })}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:border-[#8FA28A] focus:outline-none"
            >
              <option value="ALL">Semua Tingkat Emergency / Urgensi</option>
              <option value="EMERGENCY">🔴 Emergency / Darurat</option>
              <option value="HIGH">🟠 High (Tinggi)</option>
              <option value="MEDIUM">🔵 Medium (Sedang)</option>
              <option value="LOW">⚪ Low (Biasa)</option>
            </select>
          </>
        )}

        {/* Date Range Filtering */}
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg text-xs">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className="text-[10px] font-bold text-gray-500">Mulai:</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange({ startDate: e.target.value })}
            className="bg-transparent text-xs text-gray-700 font-semibold focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg text-xs">
          <span className="text-[10px] font-bold text-gray-500">Sampai:</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange({ endDate: e.target.value })}
            className="bg-transparent text-xs text-gray-700 font-semibold focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
