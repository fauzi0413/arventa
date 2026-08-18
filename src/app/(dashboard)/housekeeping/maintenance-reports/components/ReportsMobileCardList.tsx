'use client';

import React from 'react';
import { Eye, Sparkles, Wrench, Star } from 'lucide-react';
import { HousekeepingReport, MaintenanceReportItem } from '../types';

interface ReportsMobileCardListProps {
  activeTab: 'HOUSEKEEPING' | 'MAINTENANCE';
  housekeepingReports: HousekeepingReport[];
  maintenanceReports: MaintenanceReportItem[];
  onSelectHousekeeping: (report: HousekeepingReport) => void;
  onSelectMaintenance: (report: MaintenanceReportItem) => void;
}

export default function ReportsMobileCardList({
  activeTab,
  housekeepingReports,
  maintenanceReports,
  onSelectHousekeeping,
  onSelectMaintenance,
}: ReportsMobileCardListProps) {
  if (activeTab === 'HOUSEKEEPING') {
    return (
      <div className="block md:hidden space-y-3">
        {housekeepingReports.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400 text-xs font-semibold">
            Tidak ada panggilan kebersihan ditemukan.
          </div>
        ) : (
          housekeepingReports.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3 transition-all hover:shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-black text-gray-400 block">{item.ticketNumber}</span>
                  <h4 className="text-sm font-black text-gray-800 mt-0.5">{item.unitNumber}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold">{item.propertyName}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[9px] font-black uppercase text-emerald-800">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  {item.status}
                </span>
              </div>

              <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-1">
                <h5 className="text-xs font-bold text-gray-800">
                  Layanan: {item.serviceType.replace('_', ' ')}
                </h5>
                <p className="text-[11px] text-gray-500">Pelapor: {item.reportedBy?.name}</p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                {item.rating ? (
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>{item.rating.score}/5 Bintang</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 italic">Belum Dinilai</span>
                )}

                <button
                  type="button"
                  onClick={() => onSelectHousekeeping(item)}
                  className="min-h-[44px] min-w-[44px] px-4 py-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs font-black transition-all shadow-sm active:scale-95"
                >
                  <Eye className="h-4 w-4" />
                  <span>Detail</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="block md:hidden space-y-3">
      {maintenanceReports.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400 text-xs font-semibold">
          Tidak ada laporan kerusakan ditemukan.
        </div>
      ) : (
        maintenanceReports.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3 transition-all hover:shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] font-black text-gray-400 block">{item.ticketNumber}</span>
                <h4 className="text-sm font-black text-gray-800 mt-0.5">{item.unitNumber}</h4>
                <p className="text-[10px] text-gray-400 font-semibold">{item.propertyName}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[9px] font-black uppercase text-amber-800">
                <Wrench className="h-3 w-3 text-amber-600" />
                {item.status}
              </span>
            </div>

            <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                  {item.priority}
                </span>
                {item.costLiability && (
                  <span className="text-[9px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                    Beban: {item.costLiability}
                  </span>
                )}
              </div>
              <h5 className="text-xs font-bold text-gray-800">{item.title}</h5>
              <p className="text-[11px] text-gray-500 line-clamp-2">{item.description}</p>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 block">Pelapor: {item.reportedBy?.name}</span>
                {item.actualCost ? (
                  <span className="text-xs font-bold text-emerald-700">Rp {item.actualCost.toLocaleString('id-ID')}</span>
                ) : item.estimatedCost ? (
                  <span className="text-xs font-bold text-amber-700">Est: Rp {item.estimatedCost.toLocaleString('id-ID')}</span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onSelectMaintenance(item)}
                className="min-h-[44px] min-w-[44px] px-4 py-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs font-black transition-all shadow-sm active:scale-95"
              >
                <Eye className="h-4 w-4" />
                <span>Detail</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
