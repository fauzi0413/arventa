'use client';

import React from 'react';
import { Wrench, CheckCircle2, Eye, Star, Play } from 'lucide-react';
import { MaintenanceReportItem, MaintenanceStatus, ReportPriority } from '../../types';

interface MaintenanceTableProps {
  reports: MaintenanceReportItem[];
  onSelectReport: (report: MaintenanceReportItem) => void;
  onOpenResolveModal: (report: MaintenanceReportItem) => void;
  onStartRepair?: (reportId: string) => void;
}

export default function MaintenanceTable({
  reports,
  onSelectReport,
  onOpenResolveModal,
  onStartRepair,
}: MaintenanceTableProps) {
  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'REPORTED':
        return { bg: 'bg-red-100 text-red-800 border-red-200', label: 'Baru Dilaporkan' };
      case 'INSPECTION':
        return { bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Inspeksi Lapangan' };
      case 'IN_PROGRESS':
        return { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Dalam Perbaikan' };
      case 'RESOLVED':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Selesai Diperbaiki' };
      case 'CLOSED':
        return { bg: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Ditutup Resmi' };
      default:
        return { bg: 'bg-gray-100 text-gray-700 border-gray-200', label: status };
    }
  };

  const getPriorityBadge = (priority: ReportPriority) => {
    switch (priority) {
      case 'EMERGENCY':
        return { bg: 'bg-red-600 text-white', label: 'EMERGENCY' };
      case 'HIGH':
        return { bg: 'bg-orange-500 text-white', label: 'HIGH' };
      case 'MEDIUM':
        return { bg: 'bg-amber-500 text-white', label: 'MEDIUM' };
      default:
        return { bg: 'bg-gray-500 text-white', label: 'LOW' };
    }
  };

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-3 shadow-sm">
        <Wrench className="h-10 w-10 text-amber-500 mx-auto" />
        <h3 className="text-sm font-bold text-gray-700">Tidak Ada Laporan Kerusakan Ditemukan</h3>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          Belum ada laporan kerusakan fasilitas atau aset yang sesuai dengan filter pencarian.
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
            <th className="px-4 py-3.5">Laporan Kerusakan</th>
            <th className="px-4 py-3.5">Urgensi</th>
            <th className="px-4 py-3.5">Pelapor & Teknisi</th>
            <th className="px-4 py-3.5">Status Perbaikan</th>
            <th className="px-4 py-3.5">Rating CSAT</th>
            <th className="px-4 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reports.map((report) => {
            const statusBadge = getStatusBadge(report.status);
            const priorityBadge = getPriorityBadge(report.priority);

            return (
              <tr key={report.id} className="hover:bg-gray-50/60 transition-colors">
                {/* Ticket & Room */}
                <td className="px-4 py-3.5 font-medium">
                  <span className="font-mono font-bold text-gray-900 block">{report.ticketNumber}</span>
                  <span className="font-black text-[#8FA28A]">{report.unitNumber}</span>
                  <span className="text-[10px] text-gray-400 block">{report.propertyName}</span>
                </td>

                {/* Title & Description */}
                <td className="px-4 py-3.5 max-w-xs">
                  <span className="font-bold text-gray-800 block truncate" title={report.title}>
                    {report.title}
                  </span>
                  <span className="text-[10px] text-gray-400 truncate block" title={report.description}>
                    {report.description}
                  </span>
                </td>

                {/* Urgency Priority */}
                <td className="px-4 py-3.5">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${priorityBadge.bg}`}>
                    {priorityBadge.label}
                  </span>
                </td>

                {/* Reporter & Staff */}
                <td className="px-4 py-3.5">
                  <span className="font-bold text-gray-800 block">{report.reportedBy?.name || 'Penyewa'}</span>
                  <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                    PIC: {report.assignedStaff?.name || 'Mas Rudi (Teknisi)'}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3.5">
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusBadge.bg}`}>
                    {statusBadge.label}
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
                  {report.status === 'REPORTED' && onStartRepair && (
                    <button
                      onClick={() => onStartRepair(report.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 text-[11px] font-bold transition-all shadow-sm"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Mulai Kerjakan
                    </button>
                  )}

                  {report.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => onOpenResolveModal(report)}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-2.5 py-1.5 text-[11px] font-bold transition-all shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Tandai Selesai
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
