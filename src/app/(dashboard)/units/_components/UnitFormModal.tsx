'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Layers, Sparkles } from 'lucide-react';
import { Unit, UnitStatus, UnitPricing, UnitCapacity } from '../_types';
import FacilitySelector from './FacilitySelector';
import { Property } from '../../properties/_types';

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (unitData: Omit<Unit, 'id' | 'createdAt'>) => Promise<void> | void;
  onSubmitBatch?: (unitsData: Omit<Unit, 'id' | 'createdAt'>[]) => Promise<void> | void;
  initialData?: Unit | null;
  initialPropertyId?: string;
  properties: Property[];
  defaultMode?: 'single' | 'batch';
}

const STATUS_OPTIONS: { value: UnitStatus; label: string }[] = [
  { value: 'Available', label: 'Tersedia (Available)' },
  { value: 'Occupied', label: 'Terisi (Occupied)' },
  { value: 'Need Cleaning', label: 'Perlu Dibersihkan' },
  { value: 'Maintenance', label: 'Perbaikan (Maintenance)' },
  { value: 'Reserved', label: 'Reserved / Dipesan' },
];

export default function UnitFormModal({
  isOpen,
  onClose,
  onSubmit,
  onSubmitBatch,
  initialData,
  initialPropertyId,
  properties,
  defaultMode = 'single',
}: UnitFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationMode, setCreationMode] = useState<'single' | 'batch'>(
    initialData ? 'single' : defaultMode
  );

  // Form states (Single mode)
  const [propertyId, setPropertyId] = useState(
    initialData?.propertyId || initialPropertyId || properties[0]?.id || ''
  );
  const [name, setName] = useState(initialData?.name || '');
  const [status, setStatus] = useState<UnitStatus>(initialData?.status || 'Available');
  const [facilities, setFacilities] = useState<string[]>(initialData?.facilities || []);
  const [description, setDescription] = useState(initialData?.description || '');

  // Batch Mode states
  const [batchCount, setBatchCount] = useState<number>(5);
  const [namePrefix, setNamePrefix] = useState<string>('Kamar ');
  const [startNumber, setStartNumber] = useState<number>(101);

  // Capacity states
  const [maxPersons, setMaxPersons] = useState<number>(initialData?.capacity?.maxPersons || 1);
  const [dimensions, setDimensions] = useState(initialData?.capacity?.dimensions || '3x4 m');

  // Pricing states (blank by default when adding a new unit)
  const [priceMonthly, setPriceMonthly] = useState<number | ''>(initialData?.pricing?.monthly ?? '');
  const [priceDaily, setPriceDaily] = useState<number | ''>(initialData?.pricing?.daily ?? '');
  const [priceDeposit, setPriceDeposit] = useState<number | ''>(initialData?.pricing?.deposit ?? '');
  const [utilities, setUtilities] = useState(initialData?.pricing?.utilities || '');

  // Tenant states (only active when Occupied in single mode)
  const [tenantName, setTenantName] = useState(initialData?.tenantName || '');
  const [tenantPhone, setTenantPhone] = useState(initialData?.tenantPhone || '');
  const [checkInDate, setCheckInDate] = useState(initialData?.checkInDate || '');

  useEffect(() => {
    if (initialData) {
      setPropertyId(initialData.propertyId || initialPropertyId || properties[0]?.id || '');
      setName(initialData.name || '');
      setStatus(initialData.status || 'Available');
      setFacilities(initialData.facilities || []);
      setDescription(initialData.description || '');
      setMaxPersons(initialData.capacity?.maxPersons || 1);
      setDimensions(initialData.capacity?.dimensions || '3x4 m');
      setPriceMonthly(initialData.pricing?.monthly ?? '');
      setPriceDaily(initialData.pricing?.daily ?? '');
      setPriceDeposit(initialData.pricing?.deposit ?? '');
      setUtilities(initialData.pricing?.utilities || '');
      setTenantName(initialData.tenantName || '');
      setTenantPhone(initialData.tenantPhone || '');
      setCheckInDate(initialData.checkInDate ? initialData.checkInDate.split('T')[0] : '');
    } else {
      setPropertyId(initialPropertyId || properties[0]?.id || '');
      setName('');
      setStatus('Available');
      setFacilities([]);
      setDescription('');
      setMaxPersons(1);
      setDimensions('3x4 m');
      setPriceMonthly('');
      setPriceDaily('');
      setPriceDeposit('');
      setUtilities('');
      setTenantName('');
      setTenantPhone('');
      setCheckInDate('');
    }
  }, [initialData, isOpen, initialPropertyId, properties]);

  if (!isOpen) return null;

  // Generate preview unit names for batch mode
  const getBatchPreviewNames = () => {
    const names: string[] = [];
    const count = Math.min(Math.max(1, batchCount), 50);
    for (let i = 0; i < count; i++) {
      names.push(`${namePrefix.trim()}${startNumber + i}`);
    }
    return names;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !dimensions.trim()) return;

    setIsSubmitting(true);

    try {
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

      const generateRoomCredentials = (unitName: string) => {
        const cleanName = unitName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `${cleanName || 'kamar'}@arventa.id`;
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let rand = '';
        for (let i = 0; i < 6; i++) {
          rand += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return {
          roomEmail: email,
          roomPassword: `Arv!${rand}`,
          roomPasswordLastReset: new Date().toISOString(),
        };
      };

      if (creationMode === 'single' || initialData) {
        if (!name.trim()) return;

        const roomCreds = initialData?.roomEmail && initialData?.roomPassword 
          ? { roomEmail: initialData.roomEmail, roomPassword: initialData.roomPassword, roomPasswordLastReset: initialData.roomPasswordLastReset }
          : generateRoomCredentials(name.trim());

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
          ...roomCreds,
        };

        await onSubmit(unitData);
      } else {
        // BATCH MODE
        const batchNames = getBatchPreviewNames();
        const batchUnitsData: Omit<Unit, 'id' | 'createdAt'>[] = batchNames.map((unitName) => {
          const roomCreds = generateRoomCredentials(unitName);
          return {
            propertyId,
            name: unitName,
            status,
            facilities,
            capacity,
            pricing,
            description: description.trim(),
            ...roomCreds,
          };
        });

        if (onSubmitBatch) {
          await onSubmitBatch(batchUnitsData);
        } else {
          for (const u of batchUnitsData) {
            await onSubmit(u);
          }
        }
      }

      onClose();
    } catch (err) {
      console.error('Failed to submit unit form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-2xl bg-card dark:bg-card border border-border dark:border-border text-card-foreground dark:text-card-foreground rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border dark:border-border pb-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground dark:text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#8FA28A]" />
              {initialData
                ? 'Ubah Informasi Unit'
                : creationMode === 'batch'
                ? 'Tambah Beberapa Unit Sekaligus (Batch)'
                : 'Tambah Unit Kamar'}
            </h3>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
              {creationMode === 'batch'
                ? 'Buat beberapa unit sekaligus. Akun kamar (1 Kamar 1 Akun) otomatis di-generate.'
                : 'Isi spesifikasi unit. Akun login kamar otomatis dibuat secara otomatis per unit.'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (only for creation) */}
        {!initialData && (
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/80 dark:bg-muted/60 rounded-xl mb-4 text-xs font-bold border border-border dark:border-border">
            <button
              type="button"
              onClick={() => setCreationMode('single')}
              className={`min-h-[44px] py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                creationMode === 'single'
                  ? 'bg-card text-card-foreground dark:bg-card dark:text-card-foreground shadow-sm font-black border border-border dark:border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Plus className="h-4 w-4 text-[#8FA28A]" />
              Tambah 1 Unit (Satuan)
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('batch')}
              className={`min-h-[44px] py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                creationMode === 'batch'
                  ? 'bg-[#8FA28A] text-white shadow-sm font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Tambah Beberapa Unit (Batch)
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Properti *</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
              required
            >
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          {/* SINGLE MODE: Unit Name */}
          {creationMode === 'single' ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama / Nomor Unit *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kamar 101, Kamar A"
                className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
              />
            </div>
          ) : (
            /* BATCH MODE: Quantity, Prefix, Start Number */
            <div className="space-y-3 p-4 rounded-xl bg-white border border-[#8FA28A]/30">
              <h4 className="text-xs font-black text-[#8FA28A] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Pengaturan Pembuatan Unit Sekaligus
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Jumlah Unit *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={batchCount}
                    onChange={(e) => setBatchCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                    className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3 py-1.5 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Awalan Nama (Prefix)</label>
                  <input
                    type="text"
                    value={namePrefix}
                    onChange={(e) => setNamePrefix(e.target.value)}
                    placeholder="Contoh: Kamar , Suite "
                    className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3 py-1.5 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Nomor Awal *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={startNumber}
                    onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value)))}
                    className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3 py-1.5 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Preview generated unit names */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Pratinjau {batchCount} Unit yang Akan Dibuat:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                  {getBatchPreviewNames().slice(0, 10).map((previewName, idx) => (
                    <span key={idx} className="bg-white border border-[#8FA28A]/40 text-[#6A7866] text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {previewName}
                    </span>
                  ))}
                  {getBatchPreviewNames().length > 10 && (
                    <span className="text-[10px] text-gray-400 font-semibold align-center">
                      +{getBatchPreviewNames().length - 10} unit lainnya
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shared Status & Capacity */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status Awal *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kapasitas Maks (Orang) *</label>
              <input
                type="number"
                min="1"
                required
                value={maxPersons}
                onChange={(e) => setMaxPersons(Math.max(1, Number(e.target.value)))}
                className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Dimensi Kamar *</label>
              <input
                type="text"
                required
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="Contoh: 3x4 m, 4x5 m"
                className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing Structures */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-[#C7D3C0]/30 pt-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Harga per Bulan (Rp) *</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={priceMonthly !== '' && priceMonthly !== undefined && priceMonthly !== null ? new Intl.NumberFormat('id-ID').format(Number(priceMonthly)) : ''}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  setPriceMonthly(clean ? Number(clean) : '');
                }}
                placeholder="Contoh: 1.500.000"
                className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Harga Harian (Rp) (Opsional)</label>
              <input
                type="text"
                inputMode="numeric"
                value={priceDaily !== '' && priceDaily !== undefined && priceDaily !== null ? new Intl.NumberFormat('id-ID').format(Number(priceDaily)) : ''}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  setPriceDaily(clean ? Number(clean) : '');
                }}
                placeholder="Contoh: 150.000"
                className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Deposit / Jaminan (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={priceDeposit !== '' && priceDeposit !== undefined && priceDeposit !== null ? new Intl.NumberFormat('id-ID').format(Number(priceDeposit)) : ''}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  setPriceDeposit(clean ? Number(clean) : '');
                }}
                placeholder="Contoh: 500.000"
                className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan Biaya / Utilitas</label>
            <input
              type="text"
              value={utilities}
              onChange={(e) => setUtilities(e.target.value)}
              placeholder="Contoh: Listrik token mandiri, IPL Rp 50.000/bln"
              className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          {/* Facilities Selector */}
          <FacilitySelector
            propertyId={propertyId}
            unitId={initialData?.id}
            unitName={name || initialData?.name}
            selectedFacilities={facilities}
            onChange={setFacilities}
          />

          {/* Active Tenant assignment (read-only/disabled view for Occupied units) */}
          {creationMode === 'single' && (status === 'Occupied' || (status as string) === 'OCCUPIED') && (
            <div className="rounded-xl border border-dashed border-[#C8A96B]/50 bg-[#C8A96B]/5 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#C8A96B] uppercase tracking-wider flex items-center gap-1.5">
                  <span>🔒</span> Informasi Penyewa Aktif
                </h4>
                <span className="text-[10px] text-muted-foreground font-medium">Terkunci via Kontrak Sewa</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Nama Penyewa</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={tenantName || '-'}
                    className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-gray-100/80 text-gray-700 px-3 py-1.5 text-xs font-bold cursor-not-allowed select-none opacity-90"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">No. Handphone</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={tenantPhone || '-'}
                    className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-gray-100/80 text-gray-700 px-3 py-1.5 text-xs font-bold cursor-not-allowed select-none opacity-90"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Tanggal Check-In</label>
                  <input
                    type="date"
                    readOnly
                    disabled
                    value={checkInDate || ''}
                    className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-gray-100/80 text-gray-700 px-3 py-1.5 text-xs font-bold cursor-not-allowed select-none opacity-90"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan Tambahan / Deskripsi</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan catatan khusus mengenai unit..."
              className="w-full rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none resize-none"
            />
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
              className="min-h-[44px] rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-6 py-2 text-xs font-black transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : initialData ? (
                <span>Simpan Perubahan</span>
              ) : creationMode === 'batch' ? (
                <span>Buat {batchCount} Unit Sekaligus</span>
              ) : (
                <span>Tambah 1 Unit</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
