'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign } from 'lucide-react';
import { MaintenanceReportItem } from '../../types';
import ImageFileInput from '../common/ImageFileInput';

interface MaintenanceResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MaintenanceReportItem | null;
  onSubmitResolution?: (
    reportId: string,
    resolutionNotes: string,
    afterPhotos: string[],
    actualCost?: number
  ) => void;
  onResolve?: (
    reportId: string,
    resolutionNotes: string,
    afterPhotos: string[],
    actualCost?: number
  ) => void;
}

export default function MaintenanceResolveModal({
  isOpen,
  onClose,
  report,
  onSubmitResolution,
  onResolve,
}: MaintenanceResolveModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState('Perbaikan selesai 100%. Fasilitas berfungsi normal kembali.');
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [actualCost, setActualCost] = useState<string>('');

  if (!isOpen || !report) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = actualCost ? Number(actualCost) : undefined;
    if (onResolve) {
      onResolve(report.id, resolutionNotes, afterPhotos, costNum);
    } else if (onSubmitResolution) {
      onSubmitResolution(report.id, resolutionNotes, afterPhotos, costNum);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-gray-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#8FA28A]" />
              Form Penyelesaian Perbaikan Kerusakan
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {report.ticketNumber} - {report.title} ({report.unitNumber})
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
          {/* Resolution Notes */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Catatan Tindakan Perbaikan Teknis:
            </label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Jelaskan tindakan teknisi yang telah dilaksanakan..."
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#8FA28A] focus:outline-none"
              required
            />
          </div>

          {/* Actual Cost Input */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1 flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-[#8FA28A]" /> Realisasi Biaya Perbaikan (Rp - Opsional)
            </label>
            <input
              type="number"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              placeholder="Contoh: 150000"
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          {/* Image File Input (JPG/PNG local file picker) */}
          <ImageFileInput
            label="Unggah Foto Bukti Kondisi Setelah Diperbaiki (After)"
            images={afterPhotos}
            onChange={setAfterPhotos}
            maxFiles={4}
          />

          {/* Actions */}
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
              Simpan & Tandai Selesai Diperbaiki
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
