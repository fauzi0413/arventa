'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Sparkles, Check } from 'lucide-react';
import { HousekeepingReport, HousekeepingChecklist } from '../../types';
import ImageFileInput from '../common/ImageFileInput';

interface HousekeepingCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: HousekeepingReport | null;
  onComplete: (
    reportId: string,
    checklist: HousekeepingChecklist,
    notes: string,
    afterPhotos: string[]
  ) => void;
}

export default function HousekeepingCompleteModal({
  isOpen,
  onClose,
  report,
  onComplete,
}: HousekeepingCompleteModalProps) {
  const [checklist, setChecklist] = useState<HousekeepingChecklist>({
    bathroom: true,
    bedLinen: true,
    floorSweptMopped: true,
    trashEmptied: true,
  });
  const [notes, setNotes] = useState('Kamar selesai dibersihkan 100% sesuai standar SOP.');
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

  if (!isOpen || !report) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(
      report.id,
      checklist,
      notes,
      afterPhotos
    );
    onClose();
  };

  const toggleCheck = (key: keyof HousekeepingChecklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-gray-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#8FA28A]" />
              Form Penyelesaian SOP Housekeeping
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {report.ticketNumber} - {report.unitNumber} ({report.propertyName})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Checklist Area */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">
              Checklist Standar Kebersihan SOP:
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label
                onClick={() => toggleCheck('bathroom')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  checklist.bathroom
                    ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900 font-bold'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded flex items-center justify-center border ${
                    checklist.bathroom ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300'
                  }`}
                >
                  {checklist.bathroom && <Check className="h-3 w-3" />}
                </div>
                <span>Kamar Mandi</span>
              </label>

              <label
                onClick={() => toggleCheck('bedLinen')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  checklist.bedLinen
                    ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900 font-bold'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded flex items-center justify-center border ${
                    checklist.bedLinen ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300'
                  }`}
                >
                  {checklist.bedLinen && <Check className="h-3 w-3" />}
                </div>
                <span>Sprei & Kasur</span>
              </label>

              <label
                onClick={() => toggleCheck('floorSweptMopped')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  checklist.floorSweptMopped
                    ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900 font-bold'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded flex items-center justify-center border ${
                    checklist.floorSweptMopped ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300'
                  }`}
                >
                  {checklist.floorSweptMopped && <Check className="h-3 w-3" />}
                </div>
                <span>Lantai Menyapu & Ngepel</span>
              </label>

              <label
                onClick={() => toggleCheck('trashEmptied')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  checklist.trashEmptied
                    ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900 font-bold'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded flex items-center justify-center border ${
                    checklist.trashEmptied ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300'
                  }`}
                >
                  {checklist.trashEmptied && <Check className="h-3 w-3" />}
                </div>
                <span>Tempat Sampah</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Catatan Penanganan Housekeeper:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan kondisi setelah dibersihkan, ganti sprei warna krem..."
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#8FA28A] focus:outline-none"
              required
            />
          </div>

          {/* Image File Input (JPG/PNG local file picker) */}
          <ImageFileInput
            label="Unggah Foto Bukti Hasil Kebersihan (After)"
            images={afterPhotos}
            onChange={setAfterPhotos}
            maxFiles={4}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-black transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Tandai Selesai Dibersihkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
