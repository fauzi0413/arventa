'use client';

import React from 'react';
import { History, Eye, Sparkles, Wrench, AlertTriangle, ShieldCheck, Star } from 'lucide-react';
import { HousekeepingReport, MaintenanceReportItem } from '../../types';

interface AllHistoryTableProps {
  housekeepingReports: HousekeepingReport[];
  maintenanceReports: MaintenanceReportItem[];
  onSelectHousekeeping: (report: HousekeepingReport) => void;
  onSelectMaintenance: (report: MaintenanceReportItem) => void;
}

export default function AllHistoryTable({
  housekeepingReports,
  maintenanceReports,
  onSelectHousekeeping,
  onSelectMaintenance,
}: AllHistoryTableProps) {
  // Combine both arrays and sort by createdAt descending
  const combinedList = [
    ...housekeepingReports.map((h) => ({ type: 'HOUSEKEEPING' as const, data: h, date: new Date(h.createdAt).getTime() })),
    ...maintenanceReports.map((m) => ({ type: 'MAINTENANCE' as const, data: m, date: new Date(m.createdAt).getTime() })),
  ].sort((a, b) => b.date - a.date);

  const getPriorityBadge = (type: 'HOUSEKEEPING' | 'MAINTENANCE', item: any) => {
    if (type === 'HOUSEKEEPING') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Layanan Rutin
        </span>
      );
    }

    const priority = item.priority;
    switch (priority) {
      case 'EMERGENCY':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-300 animate-pulse flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-red-600" /> Darurat / Emergency
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Tinggi
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            Sedang
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
            Biasa
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden space-y-0">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[#8FA28A]" />
          <div>
            <h3 className="text-sm font-black text-gray-800">Riwayat Audit Lengkap Semua Laporan</h3>
            <p className="text-xs text-gray-400">Penggabungan seluruh tiket Housekeeping & Maintenance berdasarkan riwayat waktu</p>
          </div>
        </div>
        <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-xl border border-gray-200 shadow-sm">
          Total {combinedList.length} Tiket
        </span>
      </div>

      {combinedList.length === 0 ? (
        <div className="p-12 text-center space-y-2">
          <History className="h-10 w-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-600">Belum Ada Riwayat Laporan</p>
          <p className="text-xs text-gray-400">Tidak ada tiket laporan kebersihan atau perbaikan yang sesuai dengan filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Nomor Tiket & Tanggal</th>
                <th className="py-3 px-4">Kategori Laporan</th>
                <th className="py-3 px-4">Properti & Unit</th>
                <th className="py-3 px-4">Pelapor (Tenant)</th>
                <th className="py-3 px-4">Urgensi / Emergency</th>
                <th className="py-3 px-4">Status & CSAT</th>
                <th className="py-3 px-4 text-center">Aksi Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {combinedList.map(({ type, data }) => {
                const isHK = type === 'HOUSEKEEPING';
                const hk = isHK ? (data as HousekeepingReport) : null;
                const mnt = !isHK ? (data as MaintenanceReportItem) : null;

                const ticketNo = isHK ? hk?.ticketNumber : mnt?.ticketNumber;
                const createdAt = isHK ? hk?.createdAt : mnt?.createdAt;
                const propName = isHK ? hk?.propertyName : mnt?.propertyName;
                const unitNo = isHK ? hk?.unitNumber : mnt?.unitNumber;
                const reporter = isHK ? hk?.reportedBy?.name : mnt?.reportedBy?.name;
                const status = isHK ? hk?.status : mnt?.status;
                const rating = isHK ? hk?.rating : mnt?.rating;
                const title = isHK ? hk?.serviceType : mnt?.title;

                return (
                  <tr key={data.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-black text-gray-900 block">{ticketNo}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(createdAt || '').toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {isHK ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Sparkles className="h-3 w-3 text-emerald-600" /> Housekeeping
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                          <Wrench className="h-3 w-3 text-amber-600" /> Maintenance
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900 block">{unitNo}</span>
                      <span className="text-[10px] text-gray-400">{propName}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-800">{reporter || 'Penghuni'}</span>
                    </td>

                    <td className="py-3 px-4">
                      {getPriorityBadge(type, data)}
                    </td>

                    <td className="py-3 px-4 space-y-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                        {status}
                      </span>
                      {rating && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{rating.score}/5.0</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (isHK && hk) onSelectHousekeeping(hk);
                          if (!isHK && mnt) onSelectMaintenance(mnt);
                        }}
                        className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-[#8FA28A] transition-all shadow-sm"
                        title="Audit Detail & History Timeline"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
