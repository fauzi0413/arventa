'use client';

import React from 'react';
import { Sparkles, Calendar, CheckCircle2, UserCheck, Eye, Star } from 'lucide-react';
import { HousekeepingReport, HousekeepingStatus } from '../../types';

interface HousekeepingTableProps {
  reports: HousekeepingReport[];
  onSelectReport: (report: HousekeepingReport) => void;
  onOpenCompleteModal: (report: HousekeepingReport) => void;
}

export default function HousekeepingTable({
  reports,
  onSelectReport,
  onOpenCompleteModal,
}: HousekeepingTableProps) {
  const getStatusBadge = (status: HousekeepingStatus) => {
    switch (status) {
      case 'REQUESTED':
        return { bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Baru Diajukan' };
      case 'ASSIGNED':
        return { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Ditugaskan' };
      case 'IN_CLEANING':
        return { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Sedang Dibersihkan' };
      case 'COMPLETED':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Selesai Dibersihkan' };
      case 'CLOSED':
        return { bg: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Selesai & Ditutup' };
      default:
        return { bg: 'bg-gray-100 text-gray-700 border-gray-200', label: status };
    }
  };

  const getServiceLabel = (type: string) => {
    switch (type) {
      case 'DAILY_CLEAN':
        return 'Daily Clean (Harian)';
      case 'DEEP_CLEAN':
        return 'Deep Clean (Total)';
      case 'LINEN_CHANGE':
        return 'Ganti Sprei / Linen';
      case 'CHECKOUT_CLEAN':
        return 'Checkout Clean';
      default:
        return type;
    }
  };

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-3 shadow-sm">
        <Sparkles className="h-10 w-10 text-[#8FA28A] mx-auto" />
        <h3 className="text-sm font-bold text-gray-700">Tidak Ada Panggilan Kebersihan Ditemukan</h3>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          Belum ada jadwal atau laporan pembersihan kamar yang sesuai dengan filter pencarian.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50/80 text-[11px] font-black uppercase text-gray-500 border-b border-gray-100">
          <tr>
            <th className="px-4 py-3.5">Tiket & Kamar</th>
            <th className="px-4 py-3.5">Jenis Layanan</th>
            <th className="px-4 py-3.5">Pelapor & Petugas</th>
            <th className="px-4 py-3.5">Checklist SOP</th>
            <th className="px-4 py-3.5">Status Kebersihan</th>
            <th className="px-4 py-3.5">Rating CSAT</th>
            <th className="px-4 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reports.map((report) => {
            const badge = getStatusBadge(report.status);
            const isCompleted = report.status === 'COMPLETED' || report.status === 'CLOSED';

            const checklistCount = report.checklist
              ? Object.values(report.checklist).filter(Boolean).length
              : 0;

            return (
              <tr key={report.id} className="hover:bg-gray-50/60 transition-colors">
                {/* Ticket & Room */}
                <td className="px-4 py-3.5 font-medium">
                  <span className="font-mono font-bold text-gray-900 block">{report.ticketNumber}</span>
                  <span className="font-black text-[#8FA28A]">{report.unitNumber}</span>
                  <span className="text-[10px] text-gray-400 block">{report.propertyName}</span>
                </td>

                {/* Service Type */}
                <td className="px-4 py-3.5">
                  <span className="font-bold text-gray-800 block">
                    {getServiceLabel(report.serviceType)}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>

                {/* Reporter & Staff */}
                <td className="px-4 py-3.5">
                  <span className="font-bold text-gray-800 block">{report.reportedBy?.name || 'Penyewa'}</span>
                  <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                    PIC: {report.housekeeper?.name || 'Agus Lapangan'}
                  </span>
                </td>

                {/* Checklist SOP */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 text-gray-700 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{checklistCount} / 4 Item</span>
                  </div>
                  <span className="text-[9px] text-gray-400 block">K.Mandi, Kasur, Lantai, Sampah</span>
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3.5">
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${badge.bg}`}>
                    {badge.label}
                  </span>
                </td>

                {/* Rating CSAT */}
                <td className="px-4 py-3.5">
                  {report.rating ? (
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>{report.rating.score} / 5</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">Belum Dinilai</span>
                  )}
                </td>

                {/* Action Buttons */}
                <td className="px-4 py-3.5 text-right space-x-1.5">
                  {!isCompleted && (
                    <button
                      onClick={() => onOpenCompleteModal(report)}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-2.5 py-1.5 text-[11px] font-bold transition-all shadow-sm"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Selesaikan SOP
                    </button>
                  )}

                  <button
                    onClick={() => onSelectReport(report)}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-2.5 py-1.5 text-[11px] font-bold transition-all"
                  >
                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                    Detail
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
