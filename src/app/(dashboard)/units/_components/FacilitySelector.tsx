'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Plus, Info, Loader2, Package, Sparkles, ExternalLink, AlertCircle, X } from 'lucide-react';

import { getPropertyTypeConfig, SupportedPropertyType } from '@/lib/utils/propertyTypeConfig';

export interface PropertyMasterItem {
  id: string;
  name: string;
  locationType?: 'UNIT' | 'COMMON_AREA';
  quantity: number;
  allocatedQuantity?: number;
  availableQuantity?: number;
  isOverallocated?: boolean;
  installedUnits?: any[];
  condition: string;
  notes?: string | null;
}

export interface SelectedUnitInventoryRef {
  inventory_id: string;
  name: string;
  quantity: number;
  condition: string;
}

export type SelectedInventoryRef = SelectedUnitInventoryRef;

interface FacilitySelectorProps {
  propertyId?: string;
  propertyType?: SupportedPropertyType | string;
  unitId?: string;
  unitName?: string;
  selectedFacilities: string[];
  selectedInventoryIds?: string[];
  onChange: (facilities: string[], inventoryIds: string[]) => void;
  onSelectedInventoryChange?: (items: SelectedUnitInventoryRef[]) => void;
  disabled?: boolean;
}

import FacilityIcon from '@/components/common/FacilityIcon';

export default function FacilitySelector({
  propertyId,
  propertyType,
  unitId,
  unitName,
  selectedFacilities,
  selectedInventoryIds = [],
  onChange,
  onSelectedInventoryChange,
  disabled = false,
}: FacilitySelectorProps) {
  const typeConfig = getPropertyTypeConfig(propertyType);
  const predefinedItems = typeConfig.defaultFacilities;

  const [masterItems, setMasterItems] = useState<PropertyMasterItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State for "Tambah ke Master Inventaris Properti"
  const [isAddMasterOpen, setIsAddMasterOpen] = useState(false);
  const [newMasterName, setNewMasterName] = useState(predefinedItems[0] || 'AC');
  const [newMasterCustomName, setNewMasterCustomName] = useState('');
  const [newMasterCondition, setNewMasterCondition] = useState('Baik');
  const [newMasterNotes, setNewMasterNotes] = useState('');
  const [isSubmittingMaster, setIsSubmittingMaster] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);

  // Keep newMasterName in sync with property type predefined options
  useEffect(() => {
    if (predefinedItems && predefinedItems.length > 0) {
      setNewMasterName(predefinedItems[0]);
    }
  }, [typeConfig.type]);

  const loadMasterInventory = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);

    try {
      // 1. Fetch live master inventory from DB API strictly filtered for this property
      const res = await fetch(`/api/inventory?propertyId=${propertyId}`);
      if (res.ok) {
        const json = await res.json();
        const propItems = json.data?.propertyInventories || [];
        const allItems = json.data?.items || [];
        const unitInvs = json.data?.unitInventories || [];

        if (Array.isArray(propItems)) {
          const unitOnlyItems = propItems.filter((p: any) => {
            if (p.locationType === 'COMMON_AREA') return false;
            if (p.itemName?.toLowerCase().includes('wifi')) return false;
            return !p.locationType || p.locationType === 'UNIT';
          });
          setMasterItems(
            unitOnlyItems.map((p: any) => ({
              id: p.id,
              name: p.itemName,
              locationType: 'UNIT',
              quantity: Number(p.quantity) || 1,
              allocatedQuantity: Number(p.allocatedQuantity) || 0,
              availableQuantity: p.availableQuantity !== undefined ? Number(p.availableQuantity) : Math.max(0, (Number(p.quantity) || 1) - (Number(p.allocatedQuantity) || 0)),
              isOverallocated: false,
              installedUnits: p.installedUnits || [],
              condition: p.condition || 'Baik',
              notes: p.notes,
            }))
          );
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('FacilitySelector: DB fetch notice:', e);
    }

    // Strictly empty if DB has 0 items (NO dummy data)
    setMasterItems([]);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    loadMasterInventory();
  }, [loadMasterInventory]);

  // Check if a master item is currently selected by ID or Name
  const isItemSelected = (master: PropertyMasterItem) => {
    if (selectedInventoryIds && selectedInventoryIds.length > 0) {
      if (selectedInventoryIds.includes(master.id)) return true;
    }
    return selectedFacilities.some(
      (f) => f.toLowerCase() === master.name.toLowerCase() || f === master.id
    );
  };

  // Sync selected inventory objects whenever selection or master items change
  useEffect(() => {
    if (onSelectedInventoryChange && masterItems.length > 0) {
      const selectedRefs: SelectedUnitInventoryRef[] = [];
      masterItems.forEach((master) => {
        if (isItemSelected(master)) {
          selectedRefs.push({
            inventory_id: master.id,
            name: master.name,
            quantity: 1,
            condition: master.condition,
          });
        }
      });
      onSelectedInventoryChange(selectedRefs);
    }
  }, [selectedFacilities, selectedInventoryIds, masterItems, onSelectedInventoryChange]);

  const toggleFacility = (master: PropertyMasterItem) => {
    const selected = isItemSelected(master);

    const currentIds = selectedInventoryIds && selectedInventoryIds.length > 0
      ? [...selectedInventoryIds]
      : masterItems
          .filter((m) => selectedFacilities.some((f) => f.toLowerCase() === m.name.toLowerCase() || f === m.id))
          .map((m) => m.id);

    let updatedFacilities: string[];
    let updatedInventoryIds: string[];

    if (selected) {
      updatedFacilities = selectedFacilities.filter(
        (f) => f.toLowerCase() !== master.name.toLowerCase() && f !== master.id
      );
      updatedInventoryIds = currentIds.filter((id) => id !== master.id);
    } else {
      updatedFacilities = [...selectedFacilities.filter((f) => f.toLowerCase() !== master.name.toLowerCase() && f !== master.id), master.name];
      updatedInventoryIds = Array.from(new Set([...currentIds, master.id]));
    }

    onChange(updatedFacilities, updatedInventoryIds);

    if (onSelectedInventoryChange) {
      const updatedRefs = masterItems
        .filter((m) => updatedInventoryIds.includes(m.id) || updatedFacilities.some((f) => f.toLowerCase() === m.name.toLowerCase()))
        .map((m) => ({
          inventory_id: m.id,
          name: m.name,
          quantity: 1,
          condition: m.condition,
        }));
      onSelectedInventoryChange(updatedRefs);
    }
  };

  const handleCreateMasterItem = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSubmittingMaster) return;

    const itemName = newMasterName === 'Lainnya' ? newMasterCustomName.trim() : newMasterName.trim();
    if (!itemName) {
      setMasterError('Nama fasilitas atau barang wajib diisi.');
      return;
    }
    if (!propertyId) {
      setMasterError('Pilih properti terlebih dahulu.');
      return;
    }

    setIsSubmittingMaster(true);
    setMasterError(null);

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          itemName,
          quantity: 1,
          locationType: 'UNIT',
          condition: newMasterCondition,
          notes: newMasterNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const createdItem = json.data;

        const newMaster: PropertyMasterItem = {
          id: createdItem?.id || `master-${Date.now()}`,
          name: itemName,
          locationType: 'UNIT',
          quantity: 1,
          allocatedQuantity: 0,
          availableQuantity: 1,
          isOverallocated: false,
          condition: newMasterCondition,
          notes: newMasterNotes.trim() || undefined,
        };

        // Add to state and auto-select in unit
        setMasterItems((prev) => [newMaster, ...prev]);
        const updatedFacs = selectedFacilities.includes(itemName) ? selectedFacilities : [...selectedFacilities, itemName];
        const updatedInvIds = selectedInventoryIds.includes(newMaster.id) ? selectedInventoryIds : [...selectedInventoryIds, newMaster.id];
        onChange(updatedFacs, updatedInvIds);

        // Reset form & close
        setNewMasterName(predefinedItems[0] || 'AC');
        setNewMasterCustomName('');
        setNewMasterCondition('Baik');
        setNewMasterNotes('');
        setIsAddMasterOpen(false);
      } else {
        const err = await res.json();
        setMasterError(err.message || 'Gagal menyimpan fasilitas baru.');
      }
    } catch (err: any) {
      console.error('Failed to create master inventory item:', err);
      // Local fallback
      const localMaster: PropertyMasterItem = {
        id: `local-master-${Date.now()}`,
        name: itemName,
        locationType: 'UNIT',
        quantity: 1,
        allocatedQuantity: 0,
        availableQuantity: 1,
        isOverallocated: false,
        condition: newMasterCondition,
      };
      setMasterItems((prev) => [localMaster, ...prev]);
      const updatedFacs = selectedFacilities.includes(itemName) ? selectedFacilities : [...selectedFacilities, itemName];
      const updatedInvIds = selectedInventoryIds.includes(localMaster.id) ? selectedInventoryIds : [...selectedInventoryIds, localMaster.id];
      onChange(updatedFacs, updatedInvIds);
      setIsAddMasterOpen(false);
    } finally {
      setIsSubmittingMaster(false);
    }
  };

  // Strictly count only selected items that belong to Dalam Unit (Kamar)
  const selectedUnitCount = masterItems.filter((master) => isItemSelected(master)).length;

  return (
    <div className="space-y-3.5 rounded-2xl border border-border bg-muted/20 p-4">
      {/* Header with Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60 pb-3">
        <div>
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Package className="h-4 w-4 text-[#8FA28A]" />
            <span>{typeConfig.facilitiesTitle}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {typeConfig.facilitiesDescription}
          </p>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsAddMasterOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8FA28A]/15 hover:bg-[#8FA28A]/25 text-[#8FA28A] border border-[#8FA28A]/30 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Barang Baru</span>
        </button>
      </div>

      {/* Checklist / Multi-select Picker */}
      {loading ? (
        <div className="flex items-center justify-center p-6 bg-card rounded-xl border border-border">
          <Loader2 className="h-4 w-4 animate-spin text-[#8FA28A] mr-2" />
          <span className="text-xs font-semibold text-muted-foreground">
            Memuat daftar fasilitas...
          </span>
        </div>
      ) : masterItems.length === 0 ? (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Info className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Belum Ada Pilihan Fasilitas</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Belum ada perabot atau fasilitas terdaftar untuk {typeConfig.unitLabel.toLowerCase()}. Tambahkan barang baru agar dapat dipilih pada unit ini.
          </p>
          <button
            type="button"
            onClick={() => setIsAddMasterOpen(true)}
            className="mt-1 px-3.5 py-1.5 rounded-xl bg-[#8FA28A] text-white text-xs font-bold hover:bg-[#8FA28A]/90 transition-colors shadow-xs cursor-pointer"
          >
            + Tambah Fasilitas Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
          {masterItems.map((master) => {
            const isSelected = isItemSelected(master);

            return (
              <button
                key={master.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleFacility(master)}
                className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all text-left ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${
                  isSelected
                    ? 'border-[#8FA28A] bg-[#8FA28A]/10 text-foreground font-bold shadow-2xs'
                    : 'border-border bg-card/90 text-muted-foreground font-semibold hover:border-[#8FA28A]/50 hover:bg-muted/30 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background border border-border text-foreground shadow-2xs">
                    <FacilityIcon name={master.name} className="h-4 w-4 text-[#8FA28A]" />
                  </span>
                  <div className="truncate min-w-0">
                    <span className="block truncate font-bold text-foreground text-xs">{master.name}</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-normal mt-0.5 truncate">
                      <span>Kondisi: <span className="font-semibold text-foreground/80">{master.condition}</span></span>
                      {master.notes && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="truncate text-muted-foreground/80">{master.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center pl-2">
                  {isSelected ? (
                    <div className="h-5 w-5 rounded-full bg-[#8FA28A] text-white flex items-center justify-center shadow-xs">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-border bg-card hover:border-[#8FA28A]/60 transition-colors" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Items Counter */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
        <span>
          Terpilih: <strong className="text-foreground">{selectedUnitCount}</strong> fasilitas
        </span>
      </div>

      {/* POPUP MODAL: Quick Add to Property Master Inventory */}
      {isAddMasterOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#8FA28A]/15 text-[#8FA28A]">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Tambah Fasilitas {typeConfig.unitLabel}</h3>
                  <p className="text-[11px] text-muted-foreground">Tambahkan perabot atau fasilitas baru untuk unit ini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMasterOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {masterError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{masterError}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              {/* Item Selection Dropdown */}
              <div>
                <label className="block font-bold text-foreground mb-1">Pilih Rekomendasi / Kategori Fasilitas *</label>
                <select
                  value={newMasterName}
                  onChange={(e) => setNewMasterName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:border-[#8FA28A]"
                >
                  {predefinedItems.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                  <option value="Lainnya">Lainnya (Ketik Sendiri)</option>
                </select>
              </div>

              {/* Custom Write-in Name */}
              {newMasterName === 'Lainnya' && (
                <div>
                  <label className="block font-bold text-foreground mb-1">Tulis Nama Barang / Fasilitas *</label>
                  <input
                    type="text"
                    required
                    value={newMasterCustomName}
                    onChange={(e) => setNewMasterCustomName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCreateMasterItem(e);
                      }
                    }}
                    placeholder="Contoh: Meja Belajar Kayu, Kipas Dinding, Dispenser"
                    className="w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:border-[#8FA28A]"
                    autoFocus
                  />
                </div>
              )}

              {/* Area Placement (Readonly indicator) */}
              <div>
                <label className="block font-bold text-foreground mb-1">Penempatan</label>
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-medium text-foreground">
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <span className="h-2 w-2 rounded-full bg-[#8FA28A]" />
                    Di Dalam {typeConfig.unitLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded-md bg-muted border border-border/80">
                    {typeConfig.badgeLabel}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Barang ini otomatis ditambahkan ke daftar fasilitas dan langsung dipilih pada unit ini.
                </p>
              </div>

              {/* Initial Condition */}
              <div>
                <label className="block font-bold text-foreground mb-1">Kondisi Barang *</label>
                <select
                  value={newMasterCondition}
                  onChange={(e) => setNewMasterCondition(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:border-[#8FA28A]"
                >
                  <option value="Baik">Baik</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                  <option value="Hilang">Hilang</option>
                </select>
              </div>

              {/* Notes / Specs */}
              <div>
                <label className="block font-bold text-foreground mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={newMasterNotes}
                  onChange={(e) => setNewMasterNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateMasterItem(e);
                    }
                  }}
                  placeholder="Contoh: Ukuran 120x200 cm, Merk Sharp 1 PK"
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:border-[#8FA28A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  disabled={isSubmittingMaster}
                  onClick={() => setIsAddMasterOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-muted-foreground font-bold hover:bg-muted disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmittingMaster}
                  onClick={handleCreateMasterItem}
                  className="px-5 py-2 rounded-xl bg-[#8FA28A] text-white font-bold hover:bg-[#8FA28A]/90 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer min-w-[140px] justify-center"
                >
                  {isSubmittingMaster ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Tambah Barang</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
