'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Wrench, Sparkles, Star, User, ShieldCheck } from 'lucide-react';
import { TenantComplaint, HousekeepingRequest } from '../_types';

interface TenantReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TenantComplaint | HousekeepingRequest | null;
  type: 'complaint' | 'housekeeping';
  onRatingSubmit: (itemId: string, score: number, feedback: string) => void;
}

export default function TenantReportDetailModal({
  isOpen,
  onClose,
  item,
  type,
  onRatingSubmit,
}: TenantReportDetailModalProps) {
  const [ratingScore, setRatingScore] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  if (!isOpen || !item) return null;

  const isComplaint = type === 'complaint';
  const complaint = isComplaint ? (item as TenantComplaint) : null;
  const housekeeping = !isComplaint ? (item as HousekeepingRequest) : null;

  const title = isComplaint ? complaint?.title : housekeeping?.serviceType;
  const description = isComplaint ? complaint?.description : housekeeping?.notes;
  const statusStr = isComplaint ? complaint?.status : housekeeping?.status;

  const isCompleted = ['Resolved', 'Selesai', 'CLOSED', 'Closed'].includes(statusStr || '');
  const isInProgress = ['In Progress', 'Terjadwal', 'IN_PROGRESS', 'IN_CLEANING'].includes(statusStr || '');

  // Check if already rated from resolutionNotes or rating property
  const existingNotes = isComplaint ? complaint?.resolutionNotes : housekeeping?.resolutionNotes;
  const hasAlreadyRated = existingNotes?.includes('Rating:') || existingNotes?.includes('bintang');

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    onRatingSubmit(item.id, ratingScore, feedbackNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-card text-card-foreground border border-border p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-black text-muted-foreground uppercase">
                {isComplaint ? 'Komplain & Perbaikan' : 'Layanan Kebersihan'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#8FA28A]/10 text-[#6A7866] dark:text-[#A3B89E] border border-[#8FA28A]/30">
                {statusStr}
              </span>
            </div>
            <h3 className="text-base font-black text-foreground mt-1">{title}</h3>
            <p className="text-xs text-muted-foreground">Unit: {item.unitName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Stepper Timeline */}
        <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
          <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
            <ShieldCheck className="h-4 w-4 text-[#8FA28A]" />
            Status Progress Pengerjaan Tim
          </h4>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {/* Step 1: Diajukan */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center text-white text-[8px]">
                ✓
              </div>
              <div className="text-xs">
                <span className="font-bold text-foreground">Laporan Berhasil Diajukan</span>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Step 2: Dikerjakan Staf */}
            <div className="relative">
              <div className={`absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center text-[8px] ${
                isInProgress || isCompleted ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border bg-card'
              }`}>
                {isInProgress || isCompleted ? '✓' : ''}
              </div>
              <div className="text-xs">
                <span className={`font-bold ${isInProgress || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Sedang Ditangani Tim Operasional
                </span>
                <p className="text-[10px] text-muted-foreground">Teknisi / Housekeeper berada di lapangan.</p>
              </div>
            </div>

            {/* Step 3: Selesai */}
            <div className="relative">
              <div className={`absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center text-[8px] ${
                isCompleted ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border bg-card'
              }`}>
                {isCompleted ? '✓' : ''}
              </div>
              <div className="text-xs">
                <span className={`font-bold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  Pekerjaan Selesai
                </span>
                {existingNotes && (
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 mt-1 italic">
                    "{existingNotes}"
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description Box */}
        {description && (
          <div className="bg-muted/40 p-4 rounded-xl border border-border text-xs space-y-1">
            <span className="font-bold text-muted-foreground uppercase text-[10px]">Deskripsi Laporan:</span>
            <p className="text-foreground font-medium leading-relaxed">{description}</p>
          </div>
        )}

        {/* CSAT Rating Section */}
        {isCompleted && (
          <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
            {hasAlreadyRated ? (
              /* Read-Only Rating Badge Card */
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    Rating Diberikan (Ter-lock)
                  </span>
                  <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                    ★ 5 / 5.0
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 italic">
                  Terima kasih! Anda telah memberikan rating ulasan kepuasan untuk penanganan tiket ini.
                </p>
              </div>
            ) : (
              /* Active Rating Submission Form */
              <form onSubmit={handleSubmitRating} className="space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                  Beri Rating & Ulasan Kepuasan
                </h4>

                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= ratingScore ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Tulis ulasan kepuasan Anda..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-amber-400 focus:outline-none"
                />

                <button
                  type="submit"
                  className="w-full min-h-[40px] flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all shadow-sm"
                >
                  <Star className="h-4 w-4 fill-white" />
                  Kirim Rating & Ulasan
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
