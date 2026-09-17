'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Loader2, Plus, Layers, Sparkles, Info, HelpCircle, Lock } from 'lucide-react';
import { Unit, UnitStatus, UnitPricing, UnitCapacity } from '../_types';
import FacilitySelector, { SelectedInventoryRef } from './FacilitySelector';
import { Property } from '../../properties/_types';
import { getPropertyTypeConfig, SupportedPropertyType } from '@/lib/utils/propertyTypeConfig';

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

  // Derive dynamic configuration based on selected property
  const selectedProperty = useMemo(() => {
    return properties.find((p) => p.id === propertyId);
  }, [properties, propertyId]);

  const typeConfig = useMemo(() => {
    return getPropertyTypeConfig(selectedProperty);
  }, [selectedProperty]);

  const [name, setName] = useState(initialData?.name || '');
  const [status, setStatus] = useState<UnitStatus>(initialData?.status || 'Available');
  const [facilities, setFacilities] = useState<string[]>(initialData?.facilities || []);
  const [inventoryIds, setInventoryIds] = useState<string[]>(
    initialData?.inventoryIds ||
    (initialData as any)?.inventories?.map((i: any) => i.propertyInventoryId || i.id).filter(Boolean) ||
    (initialData as any)?.inventoryItems?.map((i: any) => i.propertyInventoryId || i.id).filter(Boolean) ||
    []
  );
  const [selectedInventoryRefs, setSelectedInventoryRefs] = useState<SelectedInventoryRef[]>([]);
  const [description, setDescription] = useState(initialData?.description || '');

  // Batch Mode states
  const [batchCount, setBatchCount] = useState<number>(5);
  const [namePrefix, setNamePrefix] = useState<string>(typeConfig.defaultBatchPrefix);
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

  const prevIsOpenRef = useRef(false);
  const prevDataIdRef = useRef<string | undefined>(undefined);

  // Sync batch prefix when property type changes
  useEffect(() => {
    if (!initialData && ['Kamar ', 'Pintu ', 'Unit ', 'Blok '].includes(namePrefix)) {
      setNamePrefix(typeConfig.defaultBatchPrefix);
    }
  }, [typeConfig.defaultBatchPrefix, initialData]);

  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      return;
    }

    if (isSubmitting) return;

    // Only initialize form fields when the modal opens or target unit changes
    const isNewOpen = !prevIsOpenRef.current && isOpen;
    const isTargetChanged = initialData?.id !== prevDataIdRef.current;

    if (isNewOpen || isTargetChanged) {
      prevIsOpenRef.current = true;
      prevDataIdRef.current = initialData?.id;

      if (initialData) {
        setPropertyId(initialData.propertyId || initialPropertyId || properties[0]?.id || '');
        setName(initialData.name || '');
        setStatus(initialData.status || 'Available');
        setFacilities(initialData.facilities || []);
        const initialInvIds = initialData.inventoryIds ||
          (initialData as any)?.inventories?.map((i: any) => i.propertyInventoryId || i.id).filter(Boolean) ||
          (initialData as any)?.inventoryItems?.map((i: any) => i.propertyInventoryId || i.id).filter(Boolean) ||
          [];
        setInventoryIds(initialInvIds);
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
        const resolvedPropId = initialPropertyId || properties[0]?.id || '';
        setPropertyId(resolvedPropId);
        const currentProp = properties.find((p) => p.id === resolvedPropId);
        const resolvedConfig = getPropertyTypeConfig(currentProp);

        setName('');
        setNamePrefix(resolvedConfig.defaultBatchPrefix);
        setStatus('Available');
        setFacilities([]);
        setInventoryIds([]);
        setSelectedInventoryRefs([]);
        setDescription('');
        setMaxPersons(resolvedConfig.type === 'KONTRAKAN' ? 4 : resolvedConfig.type === 'RUKO' ? 5 : 1);
        setDimensions(resolvedConfig.type === 'KONTRAKAN' ? '6x10 m' : resolvedConfig.type === 'RUKO' ? '5x15 m' : '3x4 m');
        setPriceMonthly('');
        setPriceDaily('');
        setPriceDeposit('');
        setUtilities('');
        setTenantName('');
        setTenantPhone('');
        setCheckInDate('');
      }
    }
  }, [initialData, isOpen, initialPropertyId, properties, isSubmitting]);

  if (!isOpen) return null;

  // Generate preview unit names for batch mode with clean space between prefix and number
  const getBatchPreviewNames = () => {
    const names: string[] = [];
    const count = Math.min(Math.max(1, batchCount), 50);
    const cleanPrefix = namePrefix.trim();
    const formattedPrefix = cleanPrefix ? `${cleanPrefix} ` : '';
    for (let i = 0; i < count; i++) {
      names.push(`${formattedPrefix}${startNumber + i}`);
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

        const finalInventoryIds = inventoryIds.length > 0
          ? inventoryIds
          : selectedInventoryRefs.map((r) => r.inventory_id);

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
          inventoryIds: finalInventoryIds,
        };

        await onSubmit(unitData);

        // Sync unit inventory to Master Inventory relations in database
        if (initialData?.id && finalInventoryIds.length > 0) {
          try {
            await fetch('/api/inventory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'SYNC_UNIT',
                unitId: initialData.id,
                inventoryIds: finalInventoryIds,
              }),
            });
          } catch (syncErr) {
            console.error('Failed to sync unit inventory relations:', syncErr);
          }
        }
      } else {
        // BATCH MODE
        const batchNames = getBatchPreviewNames();
        const batchInventoryIds = inventoryIds.length > 0
          ? inventoryIds
          : selectedInventoryRefs.map((r) => r.inventory_id);
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
            inventoryIds: batchInventoryIds,
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
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground dark:text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#8FA28A]" />
                {initialData
                  ? typeConfig.editUnitTitle
                  : creationMode === 'batch'
                  ? `Tambah Beberapa ${typeConfig.unitLabelPlural} Sekaligus (Batch)`
                  : typeConfig.addUnitTitle}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-[#8FA28A]/15 text-[#8FA28A] text-[10px] font-bold uppercase tracking-wider border border-[#8FA28A]/30">
                {typeConfig.badgeLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
              {creationMode === 'batch'
                ? `Buat beberapa ${typeConfig.unitLabel.toLowerCase()} sekaligus. Akun login otomatis di-generate secara individual.`
                : `Isi spesifikasi ${typeConfig.unitLabel.toLowerCase()}. Akun login otomatis dibuat per unit.`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
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
              className={`min-h-[44px] py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                creationMode === 'single'
                  ? 'bg-card text-card-foreground dark:bg-card dark:text-card-foreground shadow-sm font-black border border-border dark:border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Plus className="h-4 w-4 text-[#8FA28A]" />
              Tambah 1 {typeConfig.unitLabel} (Satuan)
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('batch')}
              className={`min-h-[44px] py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                creationMode === 'batch'
                  ? 'bg-[#8FA28A] text-white shadow-sm font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Tambah Beberapa {typeConfig.unitLabelPlural} (Batch)
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Pilih Properti *</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
              required
            >
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type-specific Helpful Hint */}
          {typeConfig.hintText && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#8FA28A]/10 border border-[#8FA28A]/30 text-xs text-[#6A7866] dark:text-[#A9BCA4] font-medium leading-relaxed">
              <Info className="h-4 w-4 text-[#8FA28A] shrink-0 mt-0.5" />
              <span>{typeConfig.hintText}</span>
            </div>
          )}

          {/* SINGLE MODE: Unit Name */}
          {creationMode === 'single' ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {typeConfig.unitNameLabel} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={typeConfig.unitNamePlaceholder}
                className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
              />
            </div>
          ) : (
            /* BATCH MODE: Quantity, Prefix, Start Number */
            <div className="space-y-3 p-4 rounded-xl bg-card dark:bg-card border border-[#8FA28A]/30">
              <h4 className="text-xs font-black text-[#8FA28A] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Pengaturan Pembuatan {typeConfig.unitLabelPlural} Sekaligus
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Jumlah Unit *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={batchCount}
                    onChange={(e) => setBatchCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                    className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3 py-1.5 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Awalan Nama ({typeConfig.unitLabel})
                  </label>
                  <input
                    type="text"
                    value={namePrefix}
                    onChange={(e) => setNamePrefix(e.target.value)}
                    placeholder={`Contoh: ${typeConfig.defaultBatchPrefix}`}
                    className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3 py-1.5 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Nomor Awal *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={startNumber}
                    onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value)))}
                    className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3 py-1.5 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Preview generated unit names */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Pratinjau {batchCount} {typeConfig.unitLabelPlural} yang Akan Dibuat:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-muted/40 rounded-lg border border-border">
                  {getBatchPreviewNames().slice(0, 10).map((previewName, idx) => (
                    <span key={idx} className="bg-card border border-[#8FA28A]/40 text-[#6A7866] dark:text-[#A9BCA4] text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
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
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Status Awal *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {typeConfig.capacityLabel} *
              </label>
              <input
                type="number"
                min="1"
                required
                value={maxPersons}
                onChange={(e) => setMaxPersons(Math.max(1, Number(e.target.value)))}
                className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {typeConfig.dimensionsLabel} *
              </label>
              <input
                type="text"
                required
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder={typeConfig.dimensionsPlaceholder}
                className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing Structures */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-[#C7D3C0]/30 pt-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Harga per Bulan (Rp) *</label>
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
                className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Harga Harian (Rp) (Opsional)</label>
              <input
                type="text"
                inputMode="numeric"
                value={priceDaily !== '' && priceDaily !== undefined && priceDaily !== null ? new Intl.NumberFormat('id-ID').format(Number(priceDaily)) : ''}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  setPriceDaily(clean ? Number(clean) : '');
                }}
                placeholder="Contoh: 150.000"
                className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Deposit / Jaminan (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={priceDeposit !== '' && priceDeposit !== undefined && priceDeposit !== null ? new Intl.NumberFormat('id-ID').format(Number(priceDeposit)) : ''}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  setPriceDeposit(clean ? Number(clean) : '');
                }}
                placeholder="Contoh: 500.000"
                className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Keterangan Biaya / Utilitas</label>
            <input
              type="text"
              value={utilities}
              onChange={(e) => setUtilities(e.target.value)}
              placeholder={typeConfig.type === 'APARTEMEN' ? "Contoh: Listrik token mandiri, IPL Rp 350.000/bln" : typeConfig.type === 'RUKO' ? "Contoh: Daya listrik 4400W pascabayar, PBB ditanggung penyewa" : "Contoh: Listrik token mandiri, PDAM termasuk"}
              className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          {/* Facilities Selector */}
          <FacilitySelector
            propertyId={propertyId}
            propertyType={typeConfig.type}
            unitId={initialData?.id}
            unitName={creationMode === 'batch' ? `Batch (${getBatchPreviewNames().length} Unit Sekaligus)` : (name || initialData?.name)}
            selectedFacilities={facilities}
            selectedInventoryIds={inventoryIds}
            onChange={(newFacilities, newInventoryIds) => {
              setFacilities(newFacilities);
              setInventoryIds(newInventoryIds);
            }}
            onSelectedInventoryChange={setSelectedInventoryRefs}
          />

          {/* Active Tenant assignment (read-only/disabled view for Occupied units) */}
          {creationMode === 'single' && (status === 'Occupied' || (status as string) === 'OCCUPIED') && (
            <div className="rounded-xl border border-dashed border-[#C8A96B]/50 bg-[#C8A96B]/5 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#C8A96B] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Informasi Penyewa Aktif
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
