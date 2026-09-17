'use client';

import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, CheckCircle2, Eye, Star } from 'lucide-react';
import { HousekeepingRequest, HousekeepingStatus } from '../_types';
import TenantReportDetailModal from './TenantReportDetailModal';

interface TenantHousekeepingCardProps {
  requests: HousekeepingRequest[];
  onOpenModal: () => void;
  hasCleaningService?: boolean;
  hasHousekeepingStaff?: boolean;
}

export default function TenantHousekeepingCard({ requests, onOpenModal, hasCleaningService = true, hasHousekeepingStaff = true }: TenantHousekeepingCardProps) {
  const [selectedItem, setSelectedItem] = useState<HousekeepingRequest | null>(null);

  const getStatusBadge = (status: HousekeepingStatus | string) => {
    switch (status) {
      case 'Selesai':
      case 'Resolved':
      case 'CLOSED':
      case 'Closed':
        return {
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />,
          label: 'Selesai Dibersihkan',
        };
      case 'Terjadwal':
      case 'In Progress':
      case 'IN_PROGRESS':
        return {
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          icon: <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />,
          label: 'Sedang Dikerjakan',
        };
      default:
        return {
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          icon: <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />,
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
    <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-5 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#8FA28A]" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Layanan Kebersihan Kamar</h3>
          </div>
          {hasCleaningService ? (
            <span className="text-xs font-bold text-muted-foreground">
              {requests.length} Pemanggilan
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Nonaktif oleh Owner
            </span>
          )}
        </div>

        {/* Notice when service is turned OFF by owner or no staff assigned */}
        {!hasCleaningService ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-center space-y-1">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Layanan Kebersihan Dinonaktifkan</p>
            <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 leading-relaxed">
              Pemilik properti sedang menonaktifkan fitur panggilan kebersihan untuk unit ini.
            </p>
          </div>
        ) : !hasHousekeepingStaff ? (
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center space-y-1">
            <p className="text-xs font-bold text-foreground">Belum Ada Staf Bertugas</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Belum ada petugas housekeeping yang ditugaskan di properti ini.
            </p>
          </div>
        ) : null}

        {/* Housekeeping Clean List View */}
        {requests.length === 0 ? (
          <div className="bg-muted/40 rounded-xl p-4 text-center space-y-1 border border-border">
            <p className="text-xs text-muted-foreground font-semibold">Belum ada riwayat panggilan kebersihan.</p>
            <p className="text-[11px] text-muted-foreground/80">
              {hasCleaningService && hasHousekeepingStaff
                ? 'Anda dapat memanggil tim housekeeping untuk menyapu, ngepel, atau mengganti sprei kamar.'
                : 'Layanan kebersihan belum tersedia untuk dipanggil.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {requests.map((item) => {
              const statusBadge = getStatusBadge(item.status);
              const hasRated = item.resolutionNotes?.includes('Rating:') || item.resolutionNotes?.includes('bintang');

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors flex items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-[#8FA28A]">{item.timeSlot}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 ${statusBadge.bg}`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
                      {hasRated && (
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-amber-400" /> Rated
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-foreground truncate">{item.serviceType}</h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-[#8FA28A] flex items-center justify-center shrink-0 transition-all shadow-sm"
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
        {!hasCleaningService ? (
          <button
            type="button"
            disabled
            className="min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-muted border border-border text-muted-foreground px-4 py-2.5 text-xs font-bold cursor-not-allowed opacity-80"
          >
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            Layanan Dinonaktifkan oleh Owner
          </button>
        ) : !hasHousekeepingStaff ? (
          <button
            type="button"
            disabled
            className="min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-muted border border-border text-muted-foreground px-4 py-2.5 text-xs font-bold cursor-not-allowed opacity-80"
          >
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            Belum Ada Petugas Housekeeping
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenModal}
            className="min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2.5 text-xs font-black transition-all shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Panggil Tim Housekeeping
          </button>
        )}
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
