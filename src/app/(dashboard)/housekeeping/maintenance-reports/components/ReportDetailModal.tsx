'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Star,
  ShieldCheck,
  Sparkles,
  Wrench,
  FileText,
  DollarSign,
  Check,
} from 'lucide-react';
import { HousekeepingReport, MaintenanceReportItem } from '../types';
import ReportHistoryTimeline from './common/ReportHistoryTimeline';
import RatingSection from './common/RatingSection';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: HousekeepingReport | MaintenanceReportItem | null;
  reportType: 'HOUSEKEEPING' | 'MAINTENANCE';
  onSubmitRating?: (score: number, feedback: string) => void;
}

export default function ReportDetailModal({
  isOpen,
  onClose,
  report,
  reportType,
  onSubmitRating,
}: ReportDetailModalProps) {
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const isHousekeeping = reportType === 'HOUSEKEEPING';
  const hkReport = isHousekeeping ? (report as HousekeepingReport) : null;
  const mntReport = !isHousekeeping ? (report as MaintenanceReportItem) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-3xl bg-card text-card-foreground border border-border rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-muted-foreground">{report.ticketNumber}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#8FA28A]/10 text-[#6A7866] dark:text-[#A3B89E] border border-[#8FA28A]/30">
                {report.status}
              </span>
            </div>
            <h3 className="text-base font-black text-foreground mt-1">
              {isHousekeeping ? hkReport?.serviceType.replace('_', ' ') : mntReport?.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              Unit: <strong>{report.unitNumber}</strong> ({report.propertyName})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Specification Box */}
          <div className="grid gap-3 sm:grid-cols-3 bg-muted/40 p-4 rounded-xl border border-border text-xs">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Kategori Module</span>
              <span className="font-extrabold text-foreground uppercase flex items-center gap-1">
                {isHousekeeping ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-[#8FA28A]" /> Kebersihan (Housekeeping)
                  </>
                ) : (
                  <>
                    <Wrench className="h-3.5 w-3.5 text-amber-500" /> Perbaikan (Maintenance)
                  </>
                )}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Pelapor</span>
              <span className="font-bold text-foreground">{report.reportedBy?.name || 'Penyewa'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Petugas PIC</span>
              <span className="font-bold text-foreground">
                {isHousekeeping
                  ? hkReport?.housekeeper?.name || 'Staf Housekeeping'
                  : mntReport?.assignedStaff?.name || 'Staf Teknisi'}
              </span>
            </div>

            {!isHousekeeping && mntReport && (
              <>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Estimasi Biaya</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {mntReport.estimatedCost ? `Rp ${mntReport.estimatedCost.toLocaleString('id-ID')}` : 'Rp 0'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Tanggungan Biaya</span>
                  <span className="font-bold text-foreground uppercase">{mntReport.costLiability || 'OWNER'}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Biaya Riil Eksekusi</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {mntReport.actualCost ? `Rp ${mntReport.actualCost.toLocaleString('id-ID')}` : 'Belum diinput'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* SOP Checklist (Housekeeping Only) */}
          {isHousekeeping && hkReport?.checklist && (
            <div className="bg-muted/40 p-4 rounded-xl border border-border text-xs space-y-2">
              <h4 className="font-extrabold text-foreground uppercase text-[10px] tracking-wider">Checklist SOP Kebersihan</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${hkReport.checklist.bathroom ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-bold' : 'bg-card text-muted-foreground border-border'}`}>
                  <Check className="h-3.5 w-3.5" /> Kamar Mandi
                </div>
                <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${hkReport.checklist.bedLinen ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-bold' : 'bg-card text-muted-foreground border-border'}`}>
                  <Check className="h-3.5 w-3.5" /> Sprei & Kasur
                </div>
                <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${hkReport.checklist.floorSweptMopped ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-bold' : 'bg-card text-muted-foreground border-border'}`}>
                  <Check className="h-3.5 w-3.5" /> Lantai (Sapu & Pel)
                </div>
                <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${hkReport.checklist.trashEmptied ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-bold' : 'bg-card text-muted-foreground border-border'}`}>
                  <Check className="h-3.5 w-3.5" /> Tempat Sampah
                </div>
              </div>
            </div>
          )}

          {/* Damage Analysis & Resolution Notes */}
          <div className="bg-muted/40 p-4 rounded-xl border border-border text-xs space-y-3">
            {mntReport?.damageAnalysis && (
              <div>
                <h4 className="font-extrabold text-amber-700 dark:text-amber-300 uppercase text-[10px] tracking-wider mb-1">Hasil Analisis Inspeksi Fisik</h4>
                <p className="text-foreground leading-relaxed font-semibold bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  {mntReport.damageAnalysis}
                </p>
              </div>
            )}

            {report.resolutionNotes && (
              <div>
                <h4 className="font-extrabold text-emerald-700 dark:text-emerald-300 uppercase text-[10px] tracking-wider mb-1">Catatan Penyelesaian Staf</h4>
                <p className="text-foreground leading-relaxed font-semibold bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                  {report.resolutionNotes}
                </p>
              </div>
            )}

            {mntReport?.receiptUrl && (
              <div className="pt-1">
                <a
                  href={mntReport.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  <span>Lihat Lampiran Struk Nota Pembelian Sparepart</span>
                </a>
              </div>
            )}
          </div>

          {/* Photos Comparison */}
          {(report.photos.before.length > 0 || report.photos.after.length > 0) && (
            <div className="bg-muted/40 p-4 rounded-xl border border-border text-xs space-y-3">
              <h4 className="font-extrabold text-foreground uppercase text-[10px] tracking-wider">Dokumentasi Foto Pekerjaan (Before vs After)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 block mb-1.5">Foto Sebelum (Before)</span>
                  {report.photos.before.length === 0 ? (
                    <div className="h-24 flex items-center justify-center bg-card rounded-xl border border-dashed border-border text-muted-foreground italic">
                      Tidak ada foto sebelum
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {report.photos.before.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="Before"
                          onClick={() => setActiveImageZoom(img)}
                          className="h-24 w-full object-cover rounded-xl border border-border cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1.5">Foto Setelah (After)</span>
                  {report.photos.after.length === 0 ? (
                    <div className="h-24 flex items-center justify-center bg-card rounded-xl border border-dashed border-border text-muted-foreground italic">
                      Foto setelah belum diunggah
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {report.photos.after.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="After"
                          onClick={() => setActiveImageZoom(img)}
                          className="h-24 w-full object-cover rounded-xl border border-border cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Locked Rating & CSAT Section */}
          <div className="bg-muted/40 p-4 rounded-xl border border-border">
            <RatingSection
              rating={report.rating}
              status={report.status}
              onSubmitRating={onSubmitRating}
              isTenantView={false}
            />
          </div>

          {/* Audit History Timeline */}
          <div className="bg-muted/40 p-4 rounded-xl border border-border">
            <ReportHistoryTimeline timeline={report.timeline} />
          </div>
        </div>
      </div>
    </div>
  );
}
