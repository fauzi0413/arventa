'use client';

import React, { useState, useRef } from 'react';
import { X, AlertTriangle, Loader2, Image as ImageIcon, Send, Upload, Trash2 } from 'lucide-react';
import { TenantComplaint, ComplaintCategory, ComplaintPriority } from '../_types';

interface TenantComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (complaintData: Omit<TenantComplaint, 'id' | 'createdAt' | 'status'>) => Promise<void> | void;
  unitId: string;
  unitName: string;
}

const CATEGORY_OPTIONS: ComplaintCategory[] = [
  'Fasilitas Kamar',
  'Listrik & Lampu',
  'Pipa & Air Mandi',
  'Inventaris Perabot',
  'Jaringan WiFi',
  'Lainnya',
];

export default function TenantComplaintModal({
  isOpen,
  onClose,
  onSubmit,
  unitId,
  unitName,
}: TenantComplaintModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [category, setCategory] = useState<ComplaintCategory>('Fasilitas Kamar');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('Sedang');
  const [photoBase64, setPhotoBase64] = useState<string>('');

  if (!isOpen) return null;

  // Handle Photo File Upload & Base64 Conversion
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoBase64('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        unitId,
        unitName,
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
        photoUrl: photoBase64 || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-lg bg-[#F7F4ED] border border-[#C7D3C0] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C7D3C0]/60 pb-3 mb-4">
          <div>
            <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#C8A96B]" />
              Ajukan Komplain & Lapor Kerusakan
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Laporkan masalah fasilitas atau perbaikan kamar ({unitName}) ke tim pengelola.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-500 hover:bg-[#C7D3C0]/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Masalah *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Judul / Subjek Komplain *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: AC bocor menetes air, Kran kamar mandi mampet"
              className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tingkat Urgensi / Prioritas *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'Biasa', label: 'Biasa (Low)', color: 'border-gray-300 text-gray-700 bg-white' },
                { value: 'Sedang', label: 'Sedang (Medium)', color: 'border-amber-300 text-amber-800 bg-amber-50' },
                { value: 'Mendesak', label: 'Mendesak (High)', color: 'border-red-300 text-red-800 bg-red-50' },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value as ComplaintPriority)}
                  className={`min-h-[44px] p-2 rounded-xl border text-xs font-bold transition-all ${p.color} ${
                    priority === p.value ? 'ring-2 ring-[#8FA28A] font-black shadow-sm' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Detail Kerusakan *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan secara rinci letak masalah, kronologi, atau bagian mana yang perlu diperbaiki..."
              className="w-full rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none resize-none"
            />
          </div>

          {/* Photo File Upload Section */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Upload Foto Kerusakan (JPG / PNG)</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="complaint-photo-upload"
            />

            {photoBase64 ? (
              <div className="relative rounded-xl border border-gray-200 bg-white p-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={photoBase64}
                    alt="Foto Kerusakan"
                    className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">Foto Berhasil Diunggah</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Siap dikirim ke tim pengelola</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Hapus Foto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="complaint-photo-upload"
                className="flex items-center justify-center gap-2 min-h-[48px] rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-xs font-bold text-gray-600 hover:border-[#8FA28A] hover:bg-[#8FA28A]/5 cursor-pointer transition-all"
              >
                <Upload className="h-4 w-4 text-[#8FA28A]" />
                <span>Pilih Foto Kerusakan (JPG, PNG)</span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#C7D3C0]/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] rounded-xl border border-gray-300 bg-white px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] rounded-xl bg-[#C8A96B] hover:bg-[#C8A96B]/90 text-white px-6 py-2 text-xs font-black transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Kirim Laporan...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Kirim Laporan Komplain</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
