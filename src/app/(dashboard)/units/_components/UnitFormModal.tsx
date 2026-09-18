'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Loader2, Plus, Layers, Sparkles, Info, HelpCircle, Lock, Calculator, Key } from 'lucide-react';
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
  const [smartLockPin, setSmartLockPin] = useState(initialData?.smartLockPin || '');

  // Smart Lock input hanya aktif jika properti mengaktifkan fitur Smart Lock dan fasilitas Smart Lock dipilih
  const isSmartLockSelected = useMemo(() => {
    if (!selectedProperty?.hasSmartLock) return false;
    return (
      facilities.some((f) => f.toLowerCase().includes('smart lock')) ||
      selectedInventoryRefs.some((r) => r.name.toLowerCase().includes('smart lock'))
    );
  }, [selectedProperty?.hasSmartLock, facilities, selectedInventoryRefs]);

  // Batch Mode states
  const [batchCount, setBatchCount] = useState<number>(5);
  const [namePrefix, setNamePrefix] = useState<string>(typeConfig.defaultBatchPrefix);
  const [startNumber, setStartNumber] = useState<number>(101);

  // Capacity states
  const [maxPersons, setMaxPersons] = useState<number>(initialData?.capacity?.maxPersons || 1);
  const [dimensions, setDimensions] = useState(initialData?.capacity?.dimensions || '3x4 m');

  // Pricing states (blank by default when adding a new unit)
  const [priceYearly, setPriceYearly] = useState<number | ''>(
    initialData?.pricing?.yearly ?? (initialData?.pricing?.monthly ? initialData.pricing.monthly * 12 : '')
  );
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
        const initYearly = initialData.pricing?.yearly ?? (initialData.pricing?.monthly ? initialData.pricing.monthly * 12 : '');
        setPriceYearly(initYearly);
        setPriceMonthly(initialData.pricing?.monthly ?? (initialData.pricing?.yearly ? Math.round(initialData.pricing.yearly / 12) : ''));
        setPriceDaily(initialData.pricing?.daily ?? '');
        setPriceDeposit(initialData.pricing?.deposit ?? '');
        setUtilities(initialData.pricing?.utilities || '');
        setTenantName(initialData.tenantName || '');
        setTenantPhone(initialData.tenantPhone || '');
        setCheckInDate(initialData.checkInDate ? initialData.checkInDate.split('T')[0] : '');
        setSmartLockPin(initialData.smartLockPin || '');
      } else {
        const resolvedPropId = initialPropertyId || properties[0]?.id || '';
        setPropertyId(resolvedPropId);
        const currentProp = properties.find((p) => p.id === resolvedPropId);
        const resolvedConfig = getPropertyTypeConfig(currentProp);

        setName('');
        setNamePrefix(resolvedConfig.defaultBatchPrefix);
        setStatus('Available');
        
        // Inisialisasi fasilitas otomatis jika Smart Lock aktif pada properti (WiFi adalah fasilitas area bersama, bukan dalam unit)
        const initialFacs: string[] = [];
        if (currentProp?.hasSmartLock) initialFacs.push('Smart Lock Pintu');
        setFacilities(initialFacs);
        setInventoryIds([]);
        setSelectedInventoryRefs([]);
        setDescription('');
        setMaxPersons(resolvedConfig.type === 'KONTRAKAN' ? 4 : resolvedConfig.type === 'RUKO' ? 5 : 1);
        setDimensions(resolvedConfig.type === 'KONTRAKAN' ? '6x10 m' : resolvedConfig.type === 'RUKO' ? '5x15 m' : '3x4 m');
        setPriceYearly('');
        setPriceMonthly('');
        setPriceDaily('');
        setPriceDeposit('');
        setUtilities('');
        setTenantName('');
        setTenantPhone('');
        setCheckInDate('');
        setSmartLockPin('');
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

  // Direct price handlers without aggressive keystroke race conditions
  const handleYearlyPriceChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setPriceYearly(clean ? Number(clean) : '');
  };

  const handleMonthlyPriceChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setPriceMonthly(clean ? Number(clean) : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !dimensions.trim()) return;

    const resolvedMonthly = priceMonthly !== '' ? Number(priceMonthly) : (priceYearly !== '' ? Math.round(Number(priceYearly) / 12) : 0);
    const resolvedYearly = priceYearly !== '' ? Number(priceYearly) : (priceMonthly !== '' ? Number(priceMonthly) * 12 : undefined);

    if (!resolvedMonthly && !resolvedYearly) {
      alert('Silakan isi minimal Harga per Tahun atau Harga per Bulan');
      return;
    }

    setIsSubmitting(true);

    try {
      const isYearlyPreferred = (typeConfig.type === 'KONTRAKAN' || typeConfig.type === 'RUKO') && priceYearly !== '';
      const pricing: UnitPricing = {
        monthly: resolvedMonthly,
        yearly: resolvedYearly,
        daily: priceDaily ? Number(priceDaily) : undefined,
        deposit: Number(priceDeposit) || 0,
        utilities: utilities.trim() || undefined,
        billingScheme: isYearlyPreferred ? 'yearly' : 'monthly',
      };

      const capacity: UnitCapacity = {
        maxPersons: Number(maxPersons),
        dimensions: dimensions.trim(),
      };

      const generateRoomCredentials = (unitName: string) => {
        const propName = selectedProperty?.name || properties.find((p) => p.id === propertyId)?.name || 'prop';
        const cleanProp = propName
          .toLowerCase()
          .replace(/^(kos|kost|kontrakan|apartemen|ruko|wisma|homestay|residence)\s+/i, '')
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 16) || 'prop';
        const cleanUnit = (unitName || 'unit')
          .toLowerCase()
          .replace(/^(kamar|unit|pintu|ruang|room)\s+/i, '')
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 16) || 'unit';
        const email = `${cleanProp}.${cleanUnit}@arventa.id`;
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

        const finalFacilities = [...facilities];

        const unitData: Omit<Unit, 'id' | 'createdAt'> = {
          propertyId,
          name: name.trim(),
          status,
          facilities: finalFacilities,
          capacity,
          pricing,
          description: description.trim(),
          smartLockPin: isSmartLockSelected ? (smartLockPin.trim() || undefined) : undefined,
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
        const finalBatchFacilities = [...facilities];
        if (selectedProperty?.hasSmartLock && !finalBatchFacilities.some((f) => f.toLowerCase().includes('smart lock'))) {
          finalBatchFacilities.push('Smart Lock Pintu');
        }

        const batchUnitsData: Omit<Unit, 'id' | 'createdAt'>[] = batchNames.map((unitName) => {
          const roomCreds = generateRoomCredentials(unitName);
          return {
            propertyId,
            name: unitName,
            status,
            facilities: finalBatchFacilities,
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
      <div className="relative w-full max-w-3xl bg-card dark:bg-card border border-border dark:border-border text-card-foreground dark:text-card-foreground rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
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
              disabled={isSubmitting}
              onClick={() => setCreationMode('single')}
              className={`min-h-[44px] py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
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
              disabled={isSubmitting}
              onClick={() => setCreationMode('batch')}
              className={`min-h-[44px] py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
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
          {/* Property display (Read-only / Disabled information) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Properti
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                disabled
                value={selectedProperty?.name || properties.find((p) => p.id === propertyId)?.name || 'Properti'}
                className="w-full min-h-[44px] rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/40 text-gray-700 dark:text-gray-300 px-3.5 py-2 text-xs font-bold cursor-not-allowed select-none focus:outline-none pr-10"
              />
              <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <Lock className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Type-specific Helpful Hint */}
          {typeConfig.hintText && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#8FA28A]/10 border border-[#8FA28A]/30 text-xs text-[#6A7866] dark:text-[#A9BCA4] font-medium leading-relaxed">
              <Info className="h-4 w-4 text-[#8FA28A] shrink-0 mt-0.5" />
              <span>{typeConfig.hintText}</span>
            </div>
          )}

          {/* SINGLE MODE: Unit Name & Initial Status (2 Columns) */}
          {creationMode === 'single' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {typeConfig.unitNameLabel} <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={typeConfig.unitNamePlaceholder}
                  className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Status Awal <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  disabled={isSubmitting}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UnitStatus)}
                  className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* BATCH MODE: Quantity, Prefix, Start Number */
            <div className="space-y-3 p-4 rounded-xl bg-card dark:bg-card border border-[#8FA28A]/30">
              <h4 className="text-xs font-black text-[#8FA28A] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Pengaturan Pembuatan {typeConfig.unitLabelPlural} Sekaligus
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Jumlah Unit <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    disabled={isSubmitting}
                    value={batchCount}
                    onChange={(e) => setBatchCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                    className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3 py-1.5 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Awalan Nama ({typeConfig.unitLabel})
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={namePrefix}
                    onChange={(e) => setNamePrefix(e.target.value)}
                    placeholder={`Contoh: ${typeConfig.defaultBatchPrefix}`}
                    className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3 py-1.5 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Nomor Awal <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={isSubmitting}
                    value={startNumber}
                    onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value)))}
                    className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3 py-1.5 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* In Batch Mode: Status Awal */}
          {creationMode === 'batch' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Status Awal <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <select
                disabled={isSubmitting}
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Capacity & Dimensions (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {typeConfig.capacityLabel} <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                disabled={isSubmitting}
                value={maxPersons}
                onChange={(e) => setMaxPersons(Math.max(1, Number(e.target.value)))}
                className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {typeConfig.dimensionsLabel} <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder={typeConfig.dimensionsPlaceholder}
                className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Pricing Structures */}
          <div className="border-t border-[#C7D3C0]/30 pt-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Struktur Harga & Biaya Sewa
              </label>
              {(typeConfig.type === 'KONTRAKAN' || typeConfig.type === 'RUKO') && (
                <span className="text-[10px] font-bold text-[#8FA28A] bg-[#8FA28A]/10 px-2.5 py-0.5 rounded-full border border-[#8FA28A]/25">
                  Tipe {typeConfig.badgeLabel}: Skema Tahunan Tersedia
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Harga per Tahun */}
              <div>
                <div className="flex items-center justify-between mb-1 gap-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                    Harga per Tahun (Rp)
                    {(typeConfig.type === 'KONTRAKAN' || typeConfig.type === 'RUKO') && (
                      <span className="text-red-500 font-bold ml-0.5">*</span>
                    )}
                  </label>
                  {priceMonthly !== '' && Number(priceMonthly) > 0 && priceYearly === '' ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        const calculated = Number(priceMonthly) * 12;
                        setPriceYearly(calculated);
                      }}
                      className="text-[10px] font-bold text-[#8FA28A] hover:text-white hover:bg-[#8FA28A] bg-[#8FA28A]/10 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer border border-[#8FA28A]/30 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Hitung estimasi harga tahunan (Bulanan × 12)"
                    >
                      <Calculator className="h-3 w-3" />
                      Hitung (×12)
                    </button>
                  ) : (typeConfig.type === 'KONTRAKAN' || typeConfig.type === 'RUKO') ? (
                    <span className="text-[9px] font-bold text-[#8FA28A] uppercase bg-[#8FA28A]/10 px-1.5 py-0.5 rounded shrink-0">Utama</span>
                  ) : null}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={isSubmitting}
                  value={priceYearly !== '' && priceYearly !== undefined && priceYearly !== null ? new Intl.NumberFormat('id-ID').format(Number(priceYearly)) : ''}
                  onChange={(e) => handleYearlyPriceChange(e.target.value)}
                  placeholder={typeConfig.type === 'KONTRAKAN' ? "Contoh: 25.000.000" : typeConfig.type === 'RUKO' ? "Contoh: 45.000.000" : "Contoh: 18.000.000"}
                  className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Harga per Bulan */}
              <div>
                <div className="flex items-center justify-between mb-1 gap-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                    Harga per Bulan (Rp)
                    {typeConfig.type !== 'KONTRAKAN' && typeConfig.type !== 'RUKO' && (
                      <span className="text-red-500 font-bold ml-0.5">*</span>
                    )}
                  </label>
                  {priceYearly !== '' && Number(priceYearly) > 0 ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        const calculated = Math.round(Number(priceYearly) / 12);
                        setPriceMonthly(calculated);
                      }}
                      className="text-[10px] font-bold text-[#8FA28A] hover:text-white hover:bg-[#8FA28A] bg-[#8FA28A]/10 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer border border-[#8FA28A]/30 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Hitung estimasi harga bulanan dari harga tahunan (dibagi 12)"
                    >
                      <Calculator className="h-3 w-3" />
                      Hitung dari Tahunan (÷12)
                    </button>
                  ) : typeConfig.type === 'KOS' ? (
                    <span className="text-[9px] font-bold text-[#8FA28A] uppercase bg-[#8FA28A]/10 px-1.5 py-0.5 rounded shrink-0">Utama</span>
                  ) : null}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={isSubmitting}
                  value={priceMonthly !== '' && priceMonthly !== undefined && priceMonthly !== null ? new Intl.NumberFormat('id-ID').format(Number(priceMonthly)) : ''}
                  onChange={(e) => handleMonthlyPriceChange(e.target.value)}
                  placeholder="Contoh: 1.500.000"
                  className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Harga Harian */}
              <div>
                <div className="flex items-center justify-between mb-1 gap-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                    Harga Harian (Rp) <span className="text-gray-400 font-normal">(Opsional)</span>
                  </label>
                  {priceMonthly !== '' && Number(priceMonthly) > 0 ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        const calculated = Math.round(Number(priceMonthly) / 30);
                        setPriceDaily(calculated);
                      }}
                      className="text-[10px] font-bold text-[#8FA28A] hover:text-white hover:bg-[#8FA28A] bg-[#8FA28A]/10 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer border border-[#8FA28A]/30 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Hitung estimasi harga harian dari harga bulanan (dibagi 30 hari)"
                    >
                      <Calculator className="h-3 w-3" />
                      Hitung (÷30 hari)
                    </button>
                  ) : priceYearly !== '' && Number(priceYearly) > 0 ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        const calculated = Math.round(Number(priceYearly) / 365);
                        setPriceDaily(calculated);
                      }}
                      className="text-[10px] font-bold text-[#8FA28A] hover:text-white hover:bg-[#8FA28A] bg-[#8FA28A]/10 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer border border-[#8FA28A]/30 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Hitung estimasi harga harian dari harga tahunan (dibagi 365 hari)"
                    >
                      <Calculator className="h-3 w-3" />
                      Hitung (÷365 hari)
                    </button>
                  ) : null}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={isSubmitting}
                  value={priceDaily !== '' && priceDaily !== undefined && priceDaily !== null ? new Intl.NumberFormat('id-ID').format(Number(priceDaily)) : ''}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setPriceDaily(clean ? Number(clean) : '');
                  }}
                  placeholder="Contoh: 150.000"
                  className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Deposit / Jaminan */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Deposit / Jaminan (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={isSubmitting}
                  value={priceDeposit !== '' && priceDeposit !== undefined && priceDeposit !== null ? new Intl.NumberFormat('id-ID').format(Number(priceDeposit)) : ''}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setPriceDeposit(clean ? Number(clean) : '');
                  }}
                  placeholder="Contoh: 500.000"
                  className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Keterangan Biaya / Utilitas</label>
            <input
              type="text"
              disabled={isSubmitting}
              value={utilities}
              onChange={(e) => setUtilities(e.target.value)}
              placeholder={typeConfig.type === 'APARTEMEN' ? "Contoh: Listrik token mandiri, IPL Rp 350.000/bln" : typeConfig.type === 'RUKO' ? "Contoh: Daya listrik 4400W pascabayar, PBB ditanggung penyewa" : "Contoh: Listrik token mandiri, PDAM termasuk"}
              className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={isSubmitting}
            onChange={(newFacilities, newInventoryIds) => {
              setFacilities(newFacilities);
              setInventoryIds(newInventoryIds);
            }}
            onSelectedInventoryChange={setSelectedInventoryRefs}
          />

          {/* Smart Lock PIN (Khusus Single Unit & Hanya Tampil Jika Fasilitas Smart Lock Dipilih) */}
          {creationMode === 'single' && isSmartLockSelected && (
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-[#8FA28A]" />
                  PIN Smart Lock Pintu Unit
                </label>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Smart Lock Aktif
                </span>
              </div>
              <input
                type="text"
                disabled={isSubmitting}
                value={smartLockPin}
                onChange={(e) => setSmartLockPin(e.target.value)}
                placeholder="Contoh: 123456 atau 8899#"
                className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-background text-gray-800 dark:text-foreground px-3.5 py-2 text-xs font-bold focus:border-[#8FA28A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">
                PIN khusus untuk unit ini. Akan otomatis ditampilkan di Portal Kamar penyewa unit ini.
              </p>
            </div>
          )}

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
              disabled={isSubmitting}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan catatan khusus mengenai unit..."
              className="w-full rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
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
