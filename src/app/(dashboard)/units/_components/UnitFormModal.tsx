'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Unit, UnitStatus, UnitPricing, UnitCapacity } from '../_types';
import FacilitySelector from './FacilitySelector';
import { Property } from '../../properties/_types';

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (unitData: Omit<Unit, 'id' | 'createdAt'>) => void;
  initialData?: Unit | null;
  properties: Property[];
}

const STATUS_OPTIONS: { value: UnitStatus; label: string }[] = [
  { value: 'Available', label: 'Tersedia (Available)' },
  { value: 'Occupied', label: 'Terisi (Occupied)' },
  { value: 'Need Cleaning', label: 'Perlu Dibersihkan' },
  { value: 'Maintenance', label: 'Perbaikan (Maintenance)' },
];

export default function UnitFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  properties,
}: UnitFormModalProps) {
  // Initialize directly or fallback
  const [propertyId, setPropertyId] = useState(initialData?.propertyId || properties[0]?.id || '');
  const [name, setName] = useState(initialData?.name || '');
  const [status, setStatus] = useState<UnitStatus>(initialData?.status || 'Available');
  const [facilities, setFacilities] = useState<string[]>(initialData?.facilities || []);
  const [description, setDescription] = useState(initialData?.description || '');

  // Capacity states
  const [maxPersons, setMaxPersons] = useState<number>(initialData?.capacity.maxPersons || 1);
  const [dimensions, setDimensions] = useState(initialData?.capacity.dimensions || '3x4 m');

  // Pricing states
  const [priceMonthly, setPriceMonthly] = useState<number>(initialData?.pricing.monthly || 0);
  const [priceDaily, setPriceDaily] = useState<number>(initialData?.pricing.daily || 0);
  const [priceDeposit, setPriceDeposit] = useState<number>(initialData?.pricing.deposit || 0);
  const [utilities, setUtilities] = useState(initialData?.pricing.utilities || '');

  // Tenant states (only active when Occupied)
  const [tenantName, setTenantName] = useState(initialData?.tenantName || '');
  const [tenantPhone, setTenantPhone] = useState(initialData?.tenantPhone || '');
  const [checkInDate, setCheckInDate] = useState(initialData?.checkInDate || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !propertyId || !dimensions.trim()) return;

    const pricing: UnitPricing = {
      monthly: Number(priceMonthly),
      daily: priceDaily ? Number(priceDaily) : undefined,
      deposit: Number(priceDeposit),
      utilities: utilities.trim() || undefined,
    };

    const capacity: UnitCapacity = {
      maxPersons: Number(maxPersons),
      dimensions: dimensions.trim(),
    };

    const unitData: Omit<Unit, 'id' | 'createdAt'> = {
      propertyId,
      name: name.trim(),
      status,
      facilities,
      capacity,
      pricing,
      description: description.trim(),
      tenantName: status === 'Occupied' ? tenantName.trim() || undefined : undefined,
      tenantPhone: status === 'Occupied' ? tenantPhone.trim() || undefined : undefined,
      checkInDate: status === 'Occupied' ? checkInDate || undefined : undefined,
    };

    onSubmit(unitData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#F7F4ED] border border-[#C7D3C0] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C7D3C0]/60 pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            {initialData ? 'Ubah Informasi Unit' : 'Tambah Unit Baru'}
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
          {/* Property selection & Room Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Properti *</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
                required
              >
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nama / Nomor Unit *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kamar 101, Kamar A"
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              />
            </div>
          </div>

          {/* Status & Capacity */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status Unit *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Kapasitas Maks (Orang) *</label>
              <input
                type="number"
                min="1"
                required
                value={maxPersons}
                onChange={(e) => setMaxPersons(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Dimensi Kamar *</label>
              <input
                type="text"
                required
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="Contoh: 3x4 m, 4x5 m"
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing Structures */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-[#C7D3C0]/30 pt-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Harga per Bulan (Rp) *</label>
              <input
                type="number"
                min="0"
                required
                value={priceMonthly}
                onChange={(e) => setPriceMonthly(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Harga Harian (Rp) (Opsional)</label>
              <input
                type="number"
                min="0"
                value={priceDaily}
                onChange={(e) => setPriceDaily(Math.max(0, Number(e.target.value)))}
                placeholder="Misal: 150000"
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Deposit / Uang Jaminan (Rp)</label>
              <input
                type="number"
                min="0"
                value={priceDeposit}
                onChange={(e) => setPriceDeposit(Math.max(0, Number(e.target.value)))}
                placeholder="Misal: 500000"
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan Biaya Tambahan / Utilitas</label>
            <input
              type="text"
              value={utilities}
              onChange={(e) => setUtilities(e.target.value)}
              placeholder="Contoh: Listrik token mandiri, IPL Rp 50.000/bln"
              className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          {/* Facilities Selector */}
          <FacilitySelector
            selectedFacilities={facilities}
            onChange={setFacilities}
          />

          {/* Active Tenant assignment (if Occupied) */}
          {status === 'Occupied' && (
            <div className="rounded-xl border border-dashed border-[#C8A96B]/50 bg-[#C8A96B]/5 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <h4 className="text-xs font-bold text-[#C8A96B] uppercase tracking-wider">Informasi Penyewa Aktif</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Nama Penyewa</label>
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Nama lengkap penyewa"
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-2.5 py-1.5 text-xs focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">No. Handphone</label>
                  <input
                    type="text"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    placeholder="Contoh: 0812XXXXXXXX"
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-2.5 py-1.5 text-xs focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Tanggal Masuk (Check-In)</label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-2.5 py-1.5 text-xs focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan Tambahan / Deskripsi</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan catatan khusus mengenai unit (contoh: Posisi dekat tangga, jemuran luar)..."
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
              {initialData ? 'Simpan Perubahan' : 'Tambah Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
