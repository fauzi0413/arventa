'use client';

import React from 'react';
import { Sparkles, Wrench, Clock, CheckCircle2, History, ShieldAlert } from 'lucide-react';
import { ReportsMetrics } from '../types';

interface ReportsOverviewCardsProps {
  activeTab: 'HOUSEKEEPING' | 'MAINTENANCE' | 'HISTORY';
  metrics: ReportsMetrics;
}

export default function ReportsOverviewCards({ activeTab, metrics }: ReportsOverviewCardsProps) {
  if (activeTab === 'HOUSEKEEPING') {
    const cards = [
      {
        title: 'Total Panggilan Kebersihan',
        value: metrics.totalHousekeeping,
        unit: 'Semua Jadwal Kebersihan',
        icon: <Sparkles className="h-5 w-5 text-[#8FA28A]" />,
        border: 'border-[#C7D3C0]/40',
        valueColor: 'text-gray-800',
      },
      {
        title: 'Pending & Ditugaskan',
        value: metrics.housekeepingPending,
        unit: 'Belum Dibersihkan',
        icon: <Clock className="h-5 w-5 text-amber-600" />,
        border: 'border-amber-200/80',
        valueColor: 'text-amber-700',
      },
      {
        title: 'Selesai Dibersihkan (SOP)',
        value: metrics.housekeepingCompleted,
        unit: '100% Kamar Rapi',
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        border: 'border-emerald-200/80',
        valueColor: 'text-emerald-700',
      },
    ];

    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm space-y-2 transition-all hover:shadow`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">{card.icon}</div>
            </div>
            <div className="space-y-0.5">
              <h3 className={`text-2xl font-black ${card.valueColor}`}>{card.value}</h3>
              <p className="text-[11px] text-gray-400 font-semibold">{card.unit}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'HISTORY') {
    const totalAll = metrics.totalHousekeeping + metrics.totalMaintenance;
    const totalResolved = metrics.housekeepingCompleted + metrics.maintenanceResolved;

    const cards = [
      {
        title: 'Total Riwayat Semua Tiket',
        value: totalAll,
        unit: 'Kebersihan + Perbaikan',
        icon: <History className="h-5 w-5 text-gray-700" />,
        border: 'border-gray-200',
        valueColor: 'text-gray-900',
      },
      {
        title: 'Tiket Selesai (Closed)',
        value: totalResolved,
        unit: 'Telah Ditangani 100%',
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        border: 'border-emerald-200',
        valueColor: 'text-emerald-700',
      },
      {
        title: 'Laporan Kerusakan Aktif',
        value: metrics.maintenanceReported + metrics.maintenanceInProgress,
        unit: 'Dalam Penanganan Staf',
        icon: <Wrench className="h-5 w-5 text-amber-600" />,
        border: 'border-amber-200',
        valueColor: 'text-amber-700',
      },
      {
        title: 'Kebersihan Pending',
        value: metrics.housekeepingPending,
        unit: 'Belum Dibersihkan',
        icon: <Sparkles className="h-5 w-5 text-blue-600" />,
        border: 'border-blue-200',
        valueColor: 'text-blue-700',
      },
    ];

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm space-y-2 transition-all hover:shadow`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">{card.icon}</div>
            </div>
            <div className="space-y-0.5">
              <h3 className={`text-2xl font-black ${card.valueColor}`}>{card.value}</h3>
              <p className="text-[11px] text-gray-400 font-semibold">{card.unit}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Laporan Kerusakan',
      value: metrics.totalMaintenance,
      unit: 'Semua Tiket Aset & Kerusakan',
      icon: <Wrench className="h-5 w-5 text-amber-500" />,
      border: 'border-amber-200',
      valueColor: 'text-gray-800',
    },
    {
      title: 'Laporan Baru (Reported)',
      value: metrics.maintenanceReported,
      unit: 'Butuh Inspeksi Teknis',
      icon: <ShieldAlert className="h-5 w-5 text-red-600" />,
      border: 'border-red-200',
      valueColor: 'text-red-700',
    },
    {
      title: 'Dalam Perbaikan (In Progress)',
      value: metrics.maintenanceInProgress,
      unit: 'Sedang Ditangani Teknisi',
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      border: 'border-blue-200',
      valueColor: 'text-blue-700',
    },
    {
      title: 'Perbaikan Selesai (Resolved)',
      value: metrics.maintenanceResolved,
      unit: '100% Berfungsi Normal',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      border: 'border-emerald-200',
      valueColor: 'text-emerald-700',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm space-y-2 transition-all hover:shadow`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
              {card.title}
            </span>
            <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">{card.icon}</div>
          </div>
          <div className="space-y-0.5">
            <h3 className={`text-2xl font-black ${card.valueColor}`}>{card.value}</h3>
            <p className="text-[11px] text-gray-400 font-semibold">{card.unit}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
