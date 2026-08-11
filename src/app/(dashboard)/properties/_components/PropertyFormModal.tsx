'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Property, PropertyCategory, PropertyStatus } from '../_types';

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (propertyData: Omit<Property, 'id' | 'createdAt'>) => void;
  categories: PropertyCategory[];
  statuses: PropertyStatus[];
  initialData?: Property | null;
}

export default function PropertyFormModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  statuses,
  initialData,
}: PropertyFormModalProps) {
  // Initialize state directly from initialData or defaults
  const [name, setName] = useState(initialData?.name || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || '');
  const [statusId, setStatusId] = useState(initialData?.statusId || statuses[0]?.id || '');
  const [totalUnits, setTotalUnits] = useState<number>(initialData?.totalUnits || 0);
  const [occupiedUnits, setOccupiedUnits] = useState<number>(initialData?.occupiedUnits || 0);
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !categoryId || !statusId) return;

    onSubmit({
      name: name.trim(),
      address: address.trim(),
      categoryId,
      statusId,
      totalUnits: Number(totalUnits),
      occupiedUnits: Math.min(Number(occupiedUnits), Number(totalUnits)),
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#F7F4ED] border border-[#C7D3C0] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C7D3C0]/60 pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            {initialData ? 'Ubah Informasi Properti' : 'Tambah Properti Baru'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-[#C7D3C0]/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Properti *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kost Griya Melati"
              className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Alamat Lengkap *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Jl. Diponegoro No. 45, Bandung"
              className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status *</label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              >
                {statuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Total Unit/Kamar *</label>
              <input
                type="number"
                min="0"
                required
                value={totalUnits}
                onChange={(e) => setTotalUnits(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Terisi *</label>
              <input
                type="number"
                min="0"
                max={totalUnits}
                required
                value={occupiedUnits}
                onChange={(e) => setOccupiedUnits(Math.min(totalUnits, Math.max(0, Number(e.target.value))))}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">URL Gambar (Opsional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Contoh: https://images.unsplash.com/... (atau kosongkan untuk placeholder)"
              className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Deskripsi Properti</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Berikan keterangan detail mengenai properti, fasilitas umum, dll..."
              className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#C7D3C0]/40">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-sm font-semibold transition-colors shadow-sm"
            >
              {initialData ? 'Simpan Perubahan' : 'Tambah Properti'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
