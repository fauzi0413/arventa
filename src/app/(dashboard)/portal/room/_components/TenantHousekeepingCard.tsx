'use client';

import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, CheckCircle2, Eye, Star } from 'lucide-react';
import { HousekeepingRequest, HousekeepingStatus } from '../_types';
import TenantReportDetailModal from './TenantReportDetailModal';

interface TenantHousekeepingCardProps {
  requests: HousekeepingRequest[];
  onOpenModal: () => void;
}

export default function TenantHousekeepingCard({ requests, onOpenModal }: TenantHousekeepingCardProps) {
  const [selectedItem, setSelectedItem] = useState<HousekeepingRequest | null>(null);

  const getStatusBadge = (status: HousekeepingStatus | string) => {
    switch (status) {
      case 'Selesai':
      case 'Resolved':
      case 'CLOSED':
      case 'Closed':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="h-3 w-3 text-emerald-600" />,
          label: 'Selesai Dibersihkan',
        };
      case 'Terjadwal':
      case 'In Progress':
      case 'IN_PROGRESS':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Calendar className="h-3 w-3 text-blue-600" />,
          label: 'Sedang Dikerjakan',
        };
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock className="h-3 w-3 text-amber-600" />,
          label: 'Menunggu Respons',
        };
    }
  };

  const handleRatingSubmit = (itemId: string, score: number, feedback: string) => {
    const storedHousekeeping = localStorage.getItem('arventa_housekeeping_requests');
    if (storedHousekeeping) {
      let list: HousekeepingRequest[] = JSON.parse(storedHousekeeping);
      const updated = list.map((h) => {
        if (h.id === itemId) {
          return {
            ...h,
            status: 'Selesai' as any,
            resolutionNotes: (h.resolutionNotes || '') + ` | Dikonfirmasi Penghuni Rating: ${score}/5. ${feedback}`,
          };
        }
        return h;
      });
      localStorage.setItem('arventa_housekeeping_requests', JSON.stringify(updated));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('arventa_task_updated'));
    }
  };

  return (
    <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-5 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#8FA28A]" />
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Layanan Kebersihan Kamar</h3>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {requests.length} Pemanggilan
          </span>
        </div>

        {/* Housekeeping Clean List View */}
        {requests.length === 0 ? (
          <div className="bg-gray-50/80 rounded-xl p-4 text-center space-y-1 border border-gray-100">
            <p className="text-xs text-gray-500 font-semibold">Belum ada panggilan kebersihan.</p>
            <p className="text-[11px] text-gray-400">Anda dapat memanggil tim housekeeping untuk menyapu, ngepel, atau mengganti sprei kamar.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {requests.map((item) => {
              const statusBadge = getStatusBadge(item.status);
              const hasRated = item.resolutionNotes?.includes('Rating:') || item.resolutionNotes?.includes('bintang');

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50/40 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-[#8FA28A]">{item.timeSlot}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 ${statusBadge.bg}`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
                      {hasRated && (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-amber-400" /> Rated
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-800 truncate">{item.serviceType}</h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-[#8FA28A] flex items-center justify-center shrink-0 transition-all shadow-sm"
                    title="Lihat Detail & Progress Stepper"
                  >
                    <Eye className="h-4 w-4 text-[#8FA28A]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onOpenModal}
          className="min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2.5 text-xs font-black transition-all shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          Panggil Tim Housekeeping
        </button>
      </div>

      {/* Tenant Report Detail & Progress Modal */}
      {selectedItem && (
        <TenantReportDetailModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
          type="housekeeping"
          onRatingSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
}
