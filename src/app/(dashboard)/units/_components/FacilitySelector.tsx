'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Plus, Info, Loader2, Package, Sparkles, ExternalLink, AlertCircle, X } from 'lucide-react';

export interface PropertyMasterItem {
  id: string;
  name: string;
  quantity: number;
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
  unitId?: string;
  unitName?: string;
  selectedFacilities: string[];
  onChange: (facilities: string[]) => void;
  onSelectedInventoryChange?: (items: SelectedUnitInventoryRef[]) => void;
}

const getFacilityIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('ac')) return '❄️';
  if (n.includes('kasur') || n.includes('bed') || n.includes('springbed')) return '🛏️';
  if (n.includes('mandi') || n.includes('shower')) return '🚿';
  if (n.includes('lemari') || n.includes('pakaian')) return '🚪';
  if (n.includes('wifi') || n.includes('internet')) return '🌐';
  if (n.includes('tv') || n.includes('television')) return '📺';
  if (n.includes('dapur') || n.includes('kompor')) return '🍳';
  if (n.includes('water heater') || n.includes('pemanas')) return '🔥';
  if (n.includes('kulkas') || n.includes('refrigerator')) return '🧊';
  if (n.includes('meja') || n.includes('kursi')) return '🪑';
  return '📦';
};

export default function FacilitySelector({
  propertyId,
  unitId,
  unitName,
  selectedFacilities,
  onChange,
  onSelectedInventoryChange,
}: FacilitySelectorProps) {
  const [masterItems, setMasterItems] = useState<PropertyMasterItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State for "Tambah ke Master Inventaris Properti"
  const [isAddMasterOpen, setIsAddMasterOpen] = useState(false);
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterQty, setNewMasterQty] = useState('1');
  const [newMasterCondition, setNewMasterCondition] = useState('Baik');
  const [newMasterNotes, setNewMasterNotes] = useState('');
  const [isSubmittingMaster, setIsSubmittingMaster] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);

  const loadMasterInventory = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);

    try {
      // 1. Fetch live master inventory from DB API
      const res = await fetch(`/api/inventory?propertyId=${propertyId}`);
      if (res.ok) {
        const json = await res.json();
        const propItems = json.data?.propertyInventories || [];
        if (Array.isArray(propItems) && propItems.length > 0) {
          setMasterItems(
            propItems.map((p: any) => ({
              id: p.id,
              name: p.itemName,
              quantity: Number(p.quantity) || 1,
              condition: p.condition || 'Baik',
              notes: p.notes,
            }))
          );
          setLoading(false);
          return;
        }
      }

      // 2. Fallback: check /api/properties/[id]
      const pRes = await fetch(`/api/properties/${propertyId}`);
      if (pRes.ok) {
        const pJson = await pRes.json();
        const p = pJson.data;
        const pInventories = p?.inventories || p?.propertyInventories || [];
        if (Array.isArray(pInventories) && pInventories.length > 0) {
          setMasterItems(
            pInventories.map((inv: any) => ({
              id: inv.id,
              name: inv.itemName,
              quantity: Number(inv.quantity) || 1,
              condition: inv.condition || 'Baik',
              notes: inv.notes,
            }))
          );
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('FacilitySelector: DB fetch notice:', e);
    }

    // 3. Fallback to localStorage arventa_inventory
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('arventa_inventory');
      if (stored) {
        try {
          const all = JSON.parse(stored);
          const propItems = all.filter((i: any) => i.propertyId === propertyId);
          if (propItems.length > 0) {
            const mapped = propItems.map((i: any) => ({
              id: i.id,
              name: i.name || i.itemName,
              quantity: 1,
              condition: i.condition || 'Baik',
            }));
            setMasterItems(mapped);
            setLoading(false);
            return;
          }
        } catch (err) {}
      }
    }

    // Default Seed Master Data for Property if completely empty
    const seedMasters: PropertyMasterItem[] = [
      { id: `seed-ac-${propertyId}`, name: 'Air Conditioner (AC) 1 PK', quantity: 10, condition: 'Baik' },
      { id: `seed-bed-${propertyId}`, name: 'Kasur Springbed Queen Size', quantity: 10, condition: 'Baik' },
      { id: `seed-wardrobe-${propertyId}`, name: 'Lemari Pakaian 2 Pintu', quantity: 10, condition: 'Baik' },
      { id: `seed-desk-${propertyId}`, name: 'Meja Kerja & Kursi Ergonomis', quantity: 10, condition: 'Baik' },
      { id: `seed-tv-${propertyId}`, name: 'Smart TV 32 Inch', quantity: 5, condition: 'Baik' },
      { id: `seed-heater-${propertyId}`, name: 'Water Heater Kamar Mandi', quantity: 10, condition: 'Baik' },
      { id: `seed-wifi-${propertyId}`, name: 'Router WiFi dedicated', quantity: 10, condition: 'Baik' },
    ];
    setMasterItems(seedMasters);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    loadMasterInventory();
  }, [loadMasterInventory]);

  // Sync selected inventory objects whenever selection or master items change
  useEffect(() => {
    if (onSelectedInventoryChange && masterItems.length > 0) {
      const selectedRefs: SelectedUnitInventoryRef[] = [];
      selectedFacilities.forEach((facName) => {
        const master = masterItems.find((m) => m.name.toLowerCase() === facName.toLowerCase());
        if (master) {
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
  }, [selectedFacilities, masterItems, onSelectedInventoryChange]);

  const toggleFacility = (master: PropertyMasterItem) => {
    const isSelected = selectedFacilities.some(
      (f) => f.toLowerCase() === master.name.toLowerCase()
    );

    let updatedFacilities: string[];
    if (isSelected) {
      updatedFacilities = selectedFacilities.filter(
        (f) => f.toLowerCase() !== master.name.toLowerCase()
      );
    } else {
      updatedFacilities = [...selectedFacilities, master.name];
    }

    onChange(updatedFacilities);

    if (onSelectedInventoryChange) {
      const updatedRefs = masterItems
        .filter((m) => updatedFacilities.some((f) => f.toLowerCase() === m.name.toLowerCase()))
        .map((m) => ({
          inventory_id: m.id,
          name: m.name,
          quantity: 1,
          condition: m.condition,
        }));
      onSelectedInventoryChange(updatedRefs);
    }
  };

  const handleCreateMasterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterName.trim()) return;
    if (!propertyId) {
      setMasterError('Pilih properti terlebih dahulu.');
      return;
    }

    setIsSubmittingMaster(true);
    setMasterError(null);

    const itemName = newMasterName.trim();
    const qty = Math.max(1, Number(newMasterQty) || 1);

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          itemName,
          quantity: qty,
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
          quantity: qty,
          condition: newMasterCondition,
          notes: newMasterNotes.trim() || undefined,
        };

        // Add to state and auto-select in unit
        setMasterItems((prev) => [newMaster, ...prev]);
        if (!selectedFacilities.includes(itemName)) {
          onChange([...selectedFacilities, itemName]);
        }

        // Reset form & close
        setNewMasterName('');
        setNewMasterQty('1');
        setNewMasterCondition('Baik');
        setNewMasterNotes('');
        setIsAddMasterOpen(false);
      } else {
        const err = await res.json();
        setMasterError(err.message || 'Gagal menyimpan ke Master Inventaris');
      }
    } catch (err: any) {
      console.error('Failed to create master inventory item:', err);
      // Local fallback
      const localMaster: PropertyMasterItem = {
        id: `local-master-${Date.now()}`,
        name: itemName,
        quantity: qty,
        condition: newMasterCondition,
      };
      setMasterItems((prev) => [localMaster, ...prev]);
      if (!selectedFacilities.includes(itemName)) {
        onChange([...selectedFacilities, itemName]);
      }
      setIsAddMasterOpen(false);
    } finally {
      setIsSubmittingMaster(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-[#C7D3C0]/40 bg-muted/20 p-4">
      {/* Header with Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div>
          <label className="block text-xs font-black text-foreground flex items-center gap-1.5">
            <Package className="h-4 w-4 text-[#8FA28A]" />
            Inventaris & Fasilitas Unit
          </label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Pilih barang yang tersedia di unit ini dari <strong>Master Inventaris Properti</strong>.
          </p>
        </div>

        {/* CTA: Barang belum ada di daftar? Tambahkan ke Master Inventaris terlebih dahulu */}
        <button
          type="button"
          onClick={() => setIsAddMasterOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8FA28A]/15 hover:bg-[#8FA28A]/25 text-[#8FA28A] border border-[#8FA28A]/30 text-xs font-bold transition-all shrink-0 cursor-pointer"
          title="Tambah barang baru ke Master Inventaris Properti"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Barang belum ada di daftar? Tambahkan ke Master</span>
        </button>
      </div>

      {/* Checklist / Multi-select Picker */}
      {loading ? (
        <div className="flex items-center justify-center p-6 bg-card rounded-xl border border-border">
          <Loader2 className="h-4 w-4 animate-spin text-[#8FA28A] mr-2" />
          <span className="text-xs font-semibold text-muted-foreground">
            Memuat Master Inventaris Properti...
          </span>
        </div>
      ) : masterItems.length === 0 ? (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Info className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Belum Ada Master Inventaris pada Properti Ini</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Master Inventaris adalah single source of truth untuk seluruh perabot kamar. Klik tombol di bawah untuk mendaftarkan barang pertama.
          </p>
          <button
            type="button"
            onClick={() => setIsAddMasterOpen(true)}
            className="mt-1 px-3.5 py-1.5 rounded-xl bg-[#8FA28A] text-white text-xs font-bold hover:bg-[#8FA28A]/90 transition-colors shadow-xs"
          >
            + Tambahkan ke Master Inventaris
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
          {masterItems.map((master) => {
            const isSelected = selectedFacilities.some(
              (f) => f.toLowerCase() === master.name.toLowerCase()
            );
            const icon = getFacilityIcon(master.name);

            return (
              <button
                key={master.id}
                type="button"
                onClick={() => toggleFacility(master)}
                className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all text-left ${
                  isSelected
                    ? 'border-[#8FA28A] bg-[#8FA28A]/10 text-foreground font-bold shadow-xs'
                    : 'border-border bg-card text-muted-foreground font-semibold hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <span className="text-base shrink-0">{icon}</span>
                  <div className="truncate">
                    <span className="block truncate font-bold text-foreground">{master.name}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                      <span>Kondisi Master: {master.condition}</span>
                      {master.quantity > 1 && <span>• Stok: {master.quantity} unit</span>}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center">
                  {isSelected ? (
                    <div className="h-5 w-5 rounded-full bg-[#8FA28A] text-white flex items-center justify-center shadow-xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-border bg-card" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Items Counter */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
        <span>
          Terpilih: <strong>{selectedFacilities.length}</strong> barang inventaris master untuk unit ini
        </span>
        <span className="text-[10px] text-[#8FA28A] font-semibold flex items-center gap-1">
          <Check className="h-3 w-3" /> Terikat ke Master Data Properti
        </span>
      </div>

      {/* POPUP MODAL: Quick Add to Property Master Inventory */}
      {isAddMasterOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#8FA28A]/15 text-[#8FA28A]">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">Tambah ke Master Inventaris Properti</h3>
                  <p className="text-[11px] text-muted-foreground">Single source of truth inventaris untuk properti ini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMasterOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
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

            <form onSubmit={handleCreateMasterItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Nama Barang Master *</label>
                <input
                  type="text"
                  required
                  value={newMasterName}
                  onChange={(e) => setNewMasterName(e.target.value)}
                  placeholder="Contoh: Kipas Angin Dinding Cosmos, Meja Belajar Kayu"
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:border-[#8FA28A]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-foreground mb-1">Jumlah Total (Stok)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMasterQty}
                    onChange={(e) => setNewMasterQty(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:border-[#8FA28A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Kondisi Standar</label>
                  <select
                    value={newMasterCondition}
                    onChange={(e) => setNewMasterCondition(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:border-[#8FA28A]"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Catatan / Merek / Spesifikasi (Opsional)</label>
                <input
                  type="text"
                  value={newMasterNotes}
                  onChange={(e) => setNewMasterNotes(e.target.value)}
                  placeholder="Contoh: Garansi resmi 1 tahun, ukuran 120x60 cm"
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:border-[#8FA28A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddMasterOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-muted-foreground font-bold hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMaster}
                  className="px-5 py-2 rounded-xl bg-[#8FA28A] text-white font-bold hover:bg-[#8FA28A]/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingMaster ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan ke Master Data</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
