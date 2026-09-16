'use client';

import React, { useState } from 'react';
import { X, Sparkles, Loader2, Calendar, Clock, Send, Check } from 'lucide-react';
import { HousekeepingRequest, HousekeepingServiceType } from '../_types';

interface HousekeepingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestData: Omit<HousekeepingRequest, 'id' | 'createdAt' | 'status'>) => Promise<void> | void;
  unitId: string;
  unitName: string;
}

const SERVICE_TYPES: HousekeepingServiceType[] = [
  'Pembersihan Kamar Rutin',
  'Gantian Sprei & Sarung Bantal',
  'Pembersihan Kamar Mandi',
  'Buang Sampah & Vacuum',
];

const TIME_SLOTS = [
  'Pagi (09:00 - 11:00 WIB)',
  'Siang (13:00 - 15:00 WIB)',
  'Sore (15:00 - 17:00 WIB)',
];

export default function HousekeepingRequestModal({
  isOpen,
  onClose,
  onSubmit,
  unitId,
  unitName,
}: HousekeepingRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceType, setServiceType] = useState<HousekeepingServiceType>('Pembersihan Kamar Rutin');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !timeSlot) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        unitId,
        unitName,
        serviceType,
        scheduledDate,
        timeSlot,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit housekeeping request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-lg bg-card text-card-foreground border border-border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div>
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#8FA28A]" />
              Panggil Tim Housekeeping / Bersih-Bersih
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Jadwalkan pembersihan rutin dan penggantian sprei untuk kamar sewa Anda ({unitName}).
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Jenis Layanan Kebersihan *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setServiceType(type)}
                  className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 ${
                    serviceType === type
                      ? 'bg-[#8FA28A] text-white border-[#8FA28A] shadow-sm font-black'
                      : 'bg-card text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {serviceType === type && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Tanggal Kunjungan *</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-border bg-background text-foreground pl-10 pr-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Slot Waktu Kunjungan *</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-border bg-background text-foreground pl-10 pr-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Catatan Khusus untuk Petugas (Opsional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Titip sarung bantal warna hijau, Kunci kamar ada di smartlock..."
              className="w-full rounded-xl border border-border bg-background text-foreground px-3.5 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] rounded-xl border border-border bg-card px-5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-6 py-2 text-xs font-black transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Panggil Housekeeping</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
