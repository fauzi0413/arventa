'use client';

import React, { useState } from 'react';
import { X, Check, AlertTriangle, Layers, Tag, DollarSign, Trash2, Loader2 } from 'lucide-react';
import { Unit, UnitStatus, BulkActionType, BulkActionPayload } from '../_types';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUnits: Unit[];
  onApplyBulkAction: (payload: BulkActionPayload) => Promise<void> | void;
  initialAction?: BulkActionType;
}

const ALL_FACILITIES = [
  'AC',
  'Kasur Springbed',
  'Kamar Mandi Dalam',
  'WiFi',
  'TV',
  'Meja & Kursi',
  'Lemari Pakaian',
  'Water Heater',
  'Kulkas',
  'Balkon',
];

export default function BulkActionModal({
  isOpen,
  onClose,
  selectedUnits,
  onApplyBulkAction,
  initialAction = 'status',
}: BulkActionModalProps) {
  const [activeTab, setActiveTab] = useState<BulkActionType>(initialAction);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status state
  const [newStatus, setNewStatus] = useState<UnitStatus>('Available');

  // Facility state
  const [facilityOp, setFacilityOp] = useState<'add' | 'remove'>('add');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  // Price adjustment state
  const [priceAdjType, setPriceAdjType] = useState<'set' | 'flat_increase' | 'flat_decrease' | 'percent_increase' | 'percent_decrease'>('set');
  const [priceVal, setPriceVal] = useState<number>(0);

  if (!isOpen) return null;

  const toggleFacility = (facility: string) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(selectedFacilities.filter((f) => f !== facility));
    } else {
      setSelectedFacilities([...selectedFacilities, facility]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let payload: BulkActionPayload = { actionType: activeTab };

      if (activeTab === 'status') {
        payload.newStatus = newStatus;
      } else if (activeTab === 'facilities') {
        payload.facilityOperation = facilityOp;
        payload.facilitiesToApply = selectedFacilities;
      } else if (activeTab === 'pricing') {
        payload.priceAdjustmentType = priceAdjType;
        payload.priceValue = Number(priceVal) || 0;
      } else if (activeTab === 'delete') {
        payload.actionType = 'delete';
      }

      await onApplyBulkAction(payload);
      onClose();
    } catch (err) {
      console.error('Failed to execute bulk action:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div>
            <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#8FA28A]" />
              Aksi Massal ({selectedUnits.length} Unit)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Terapkan perubahan serentak untuk unit yang Anda pilih.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected Units Preview Pill */}
        <div className="px-6 py-2.5 bg-[#8FA28A]/10 border-b border-[#8FA28A]/20 flex items-center gap-2 overflow-x-auto text-xs text-[#6A7866] font-bold">
          <span className="shrink-0 font-black uppercase text-[10px] tracking-wider text-[#8FA28A]">Target:</span>
          {selectedUnits.slice(0, 4).map((u) => (
            <span key={u.id} className="bg-white/80 border border-[#8FA28A]/30 px-2 py-0.5 rounded-md shrink-0">
              {u.name}
            </span>
          ))}
          {selectedUnits.length > 4 && (
            <span className="text-[10px] text-gray-500 font-semibold">
              +{selectedUnits.length - 4} unit lainnya
            </span>
          )}
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-gray-100/80 mx-6 mt-4 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
              activeTab === 'status' ? 'bg-white text-gray-800 shadow-sm font-black' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Check className="h-3.5 w-3.5" /> Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('facilities')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
              activeTab === 'facilities' ? 'bg-white text-gray-800 shadow-sm font-black' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Tag className="h-3.5 w-3.5" /> Fasilitas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
              activeTab === 'pricing' ? 'bg-white text-gray-800 shadow-sm font-black' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" /> Harga
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delete')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
              activeTab === 'delete' ? 'bg-red-50 text-red-600 shadow-sm font-black' : 'text-gray-500 hover:text-red-600'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" /> Hapus
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">Pilih Status Baru untuk Semua Unit</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { value: 'Available', label: 'Tersedia (Available)', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-800' },
                  { value: 'Occupied', label: 'Terisi (Occupied)', color: 'border-blue-200 bg-blue-50/50 text-blue-800' },
                  { value: 'Need Cleaning', label: 'Perlu Dibersihkan', color: 'border-amber-200 bg-amber-50/50 text-amber-800' },
                  { value: 'Maintenance', label: 'Maintenance / Perbaikan', color: 'border-red-200 bg-red-50/50 text-red-800' },
                  { value: 'Reserved', label: 'Reserved / Dipesan', color: 'border-purple-200 bg-purple-50/50 text-purple-800' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setNewStatus(item.value as UnitStatus)}
                    className={`min-h-[44px] p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${item.color} ${
                      newStatus === item.value ? 'ring-2 ring-[#8FA28A] border-transparent font-black shadow-sm' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    {newStatus === item.value && <Check className="h-4 w-4 text-[#8FA28A]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FACILITIES */}
          {activeTab === 'facilities' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFacilityOp('add')}
                  className={`flex-1 py-2 rounded-lg min-h-[44px] transition-all ${
                    facilityOp === 'add' ? 'bg-[#8FA28A] text-white shadow-sm font-black' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  + Tambahkan Fasilitas
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityOp('remove')}
                  className={`flex-1 py-2 rounded-lg min-h-[44px] transition-all ${
                    facilityOp === 'remove' ? 'bg-red-600 text-white shadow-sm font-black' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  - Hapus Fasilitas
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  {facilityOp === 'add' ? 'Pilih fasilitas yang ingin ditambahkan:' : 'Pilih fasilitas yang ingin dicabut:'}
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ALL_FACILITIES.map((fac) => {
                    const isSelected = selectedFacilities.includes(fac);
                    return (
                      <button
                        key={fac}
                        type="button"
                        onClick={() => toggleFacility(fac)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? facilityOp === 'add'
                              ? 'bg-[#8FA28A] text-white border-[#8FA28A] shadow-sm'
                              : 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                        {fac}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Metode Penyesuaian Harga Sewa</label>
                <select
                  value={priceAdjType}
                  onChange={(e: any) => setPriceAdjType(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-800 focus:border-[#8FA28A] focus:outline-none"
                >
                  <option value="set">Atur Harga Tetap Baru (Set Flat Price)</option>
                  <option value="flat_increase">Naikkan Harga (Nominal Rp)</option>
                  <option value="flat_decrease">Turunkan Harga (Nominal Rp)</option>
                  <option value="percent_increase">Naikkan Harga (Persentase %)</option>
                  <option value="percent_decrease">Turunkan Harga (Persentase %)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {priceAdjType.includes('percent') ? 'Nilai Persentase (%)' : 'Nilai Nominal (Rp)'}
                </label>
                <div className="relative">
                  {priceAdjType.includes('percent') ? (
                    <span className="absolute right-3 top-3 text-xs font-bold text-gray-400">%</span>
                  ) : (
                    <span className="absolute left-3 top-3 text-xs font-bold text-gray-400">Rp</span>
                  )}
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={priceVal || ''}
                    onChange={(e) => setPriceVal(Number(e.target.value))}
                    className={`w-full min-h-[44px] rounded-xl border border-gray-200 py-2.5 text-xs font-bold focus:border-[#8FA28A] focus:outline-none ${
                      priceAdjType.includes('percent') ? 'pl-4 pr-8' : 'pl-10 pr-4'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {priceAdjType === 'set' && 'Semua unit terpilih akan menggunakan harga sewa bulanan baru ini.'}
                  {priceAdjType === 'flat_increase' && 'Menambahkan nominal di atas ke harga sewa bulanan tiap unit.'}
                  {priceAdjType === 'flat_decrease' && 'Mengurangi nominal di atas dari harga sewa bulanan tiap unit.'}
                  {priceAdjType === 'percent_increase' && 'Menaikkan harga sewa tiap unit sesuai persentase yang dimasukkan.'}
                  {priceAdjType === 'percent_decrease' && 'Menurunkan harga sewa tiap unit sesuai persentase yang dimasukkan.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: DELETE CONFIRMATION */}
          {activeTab === 'delete' && (
            <div className="space-y-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-red-900">Konfirmasi Hapus Massal</h4>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    Anda akan menghapus secara permanen <strong>{selectedUnits.length} unit kamar</strong> berikut. Aksi ini tidak dapat dibatalkan!
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-red-100 max-h-36 overflow-y-auto space-y-1">
                {selectedUnits.map((u) => (
                  <div key={u.id} className="text-xs font-bold text-gray-700 flex justify-between">
                    <span>• {u.name}</span>
                    <span className="text-gray-400 font-normal">{u.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                activeTab === 'delete'
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  : 'bg-[#8FA28A] hover:bg-[#8FA28A]/90 shadow-[#8FA28A]/20'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : activeTab === 'delete' ? (
                <span>Hapus {selectedUnits.length} Unit</span>
              ) : (
                <span>Terapkan pada {selectedUnits.length} Unit</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
