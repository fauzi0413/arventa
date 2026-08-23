'use client';

import React, { useState, useEffect } from 'react';
import { Check, Plus, Info, Loader2 } from 'lucide-react';

export interface PropertyInventoryAsset {
  id: string;
  name: string;
  locationLabel: string; // e.g. "Unit: Apt 12B-01" or "Area Umum"
  isUnitSpecific: boolean;
}

interface FacilitySelectorProps {
  propertyId?: string;
  unitId?: string;
  unitName?: string;
  selectedFacilities: string[];
  onChange: (facilities: string[]) => void;
}

const getFacilityIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('ac')) return '❄️';
  if (n.includes('kasur') || n.includes('bed')) return '🛏️';
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
}: FacilitySelectorProps) {
  const [inventoryAssets, setInventoryAssets] = useState<PropertyInventoryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  useEffect(() => {
    if (!propertyId) return;

    const loadPropertyInventoriesFromDB = async () => {
      setLoading(true);
      const assetsList: PropertyInventoryAsset[] = [];
      const seenIds = new Set<string>();

      try {
        // Fetch live property data with units & inventories from PostgreSQL DB
        const res = await fetch(`/api/properties/${propertyId}`);
        if (res.ok) {
          const json = await res.json();
          const p = json.data;

          if (p) {
            // 1. Property Inventories (Area Umum) - ALWAYS INCLUDE
            const propInvs = p.inventories || p.propertyInventories || [];
            if (Array.isArray(propInvs)) {
              propInvs.forEach((inv: any) => {
                const id = inv.id || `prop-inv-${inv.itemName}`;
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  assetsList.push({
                    id,
                    name: inv.itemName,
                    locationLabel: 'Area Umum',
                    isUnitSpecific: false,
                  });
                }
              });
            }

            // 2. Unit Inventories (ONLY for THIS unit, EXCLUDING items from other units)
            if (Array.isArray(p.units)) {
              p.units.forEach((u: any) => {
                const matchesThisUnit =
                  !unitId && !unitName
                    ? true
                    : (unitId && u.id === unitId) ||
                      (unitName && u.unitNumber?.toLowerCase() === unitName?.toLowerCase());

                if (matchesThisUnit) {
                  const unitLabel = `Unit: ${u.unitNumber}`;
                  const unitInvs = u.inventoryItems || u.inventories || [];
                  if (Array.isArray(unitInvs)) {
                    unitInvs.forEach((inv: any) => {
                      const id = inv.id || `unit-inv-${u.id}-${inv.itemName}`;
                      if (!seenIds.has(id)) {
                        seenIds.add(id);
                        assetsList.push({
                          id,
                          name: inv.itemName,
                          locationLabel: unitLabel,
                          isUnitSpecific: true,
                        });
                      }
                    });
                  }
                }
              });
            }
          }
        }
      } catch (e) {
        console.warn('Notice: API property inventory fetch notice:', e);
      }

      // 3. Fallback to localStorage arventa_inventory for this propertyId if DB array is empty
      if (assetsList.length === 0 && typeof window !== 'undefined') {
        const storedInv = localStorage.getItem('arventa_inventory');
        if (storedInv) {
          try {
            const allInv: any[] = JSON.parse(storedInv);
            const propInv = allInv.filter((inv) => {
              if (inv.propertyId !== propertyId) return false;
              if (inv.unitName && unitName && inv.unitName.toLowerCase() !== unitName.toLowerCase()) return false;
              if (inv.unitId && unitId && inv.unitId !== unitId) return false;
              return true;
            });
            propInv.forEach((inv) => {
              const id = inv.id || `local-inv-${inv.name || inv.itemName}`;
              if (!seenIds.has(id)) {
                seenIds.add(id);
                assetsList.push({
                  id,
                  name: inv.name || inv.itemName,
                  locationLabel: inv.unitName ? `Unit: ${inv.unitName}` : 'Area Umum',
                  isUnitSpecific: Boolean(inv.unitName),
                });
              }
            });
          } catch (e) {}
        }
      }

      // Merge any currently selected facility names that might not be in the asset list
      selectedFacilities.forEach((selName) => {
        const exists = assetsList.some((a) => a.name === selName);
        if (!exists) {
          assetsList.push({
            id: `sel-${selName}`,
            name: selName,
            locationLabel: 'Fasilitas Unit',
            isUnitSpecific: true,
          });
        }
      });

      setInventoryAssets(assetsList);
      setLoading(false);
    };

    loadPropertyInventoriesFromDB();
  }, [propertyId]);

  const toggleFacility = (facilityName: string) => {
    if (selectedFacilities.includes(facilityName)) {
      onChange(selectedFacilities.filter((f) => f !== facilityName));
    } else {
      onChange([...selectedFacilities, facilityName]);
    }
  };

  const handleAddCustomFacility = () => {
    if (!customInput.trim()) return;
    const name = customInput.trim();
    const exists = inventoryAssets.some((a) => a.name === name);
    if (!exists) {
      setInventoryAssets((prev) => [
        ...prev,
        {
          id: `custom-${Date.now()}`,
          name,
          locationLabel: 'Aset Kustom',
          isUnitSpecific: true,
        },
      ]);
    }
    if (!selectedFacilities.includes(name)) {
      onChange([...selectedFacilities, name]);
    }
    setCustomInput('');
    setShowAddInput(false);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">
          Fasilitas Unit * <span className="text-[11px] font-normal text-muted-foreground">(Database Inventaris Properti)</span>
        </label>
        <button
          type="button"
          onClick={() => setShowAddInput(!showAddInput)}
          className="text-[11px] font-bold text-[#8FA28A] hover:underline flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Tambah Barang Baru
        </button>
      </div>

      {showAddInput && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200 animate-in slide-in-from-top-1 duration-200">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomFacility();
              }
            }}
            placeholder="Ketik nama barang inventaris baru..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium bg-white focus:outline-none focus:border-[#8FA28A]"
          />
          <button
            type="button"
            onClick={handleAddCustomFacility}
            className="px-3 py-1.5 rounded-lg bg-[#8FA28A] text-white font-bold text-xs hover:bg-[#8FA28A]/90 transition-colors"
          >
            Simpan
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-4 bg-muted/20 rounded-xl border border-border">
          <Loader2 className="h-4 w-4 animate-spin text-[#8FA28A] mr-2" />
          <span className="text-xs font-semibold text-muted-foreground">Memuat aset inventaris dari database...</span>
        </div>
      ) : inventoryAssets.length === 0 ? (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2 font-medium">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Belum ada barang terdaftar pada <strong>Inventaris Barang</strong> properti ini. Tambahkan barang melalui tab Inventaris Barang pada detail properti.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
          {inventoryAssets.map((asset) => {
            const isSelected = selectedFacilities.includes(asset.name);
            const icon = getFacilityIcon(asset.name);

            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => toggleFacility(asset.name)}
                className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all ${
                  isSelected
                    ? 'border-[#8FA28A] bg-[#8FA28A]/10 text-gray-900 font-bold shadow-xs'
                    : 'border-gray-200 bg-white text-gray-600 font-semibold hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-base shrink-0">{icon}</span>
                  <div className="text-left truncate">
                    <span className="block truncate font-bold">{asset.name}</span>
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${
                        asset.isUnitSpecific
                          ? 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}
                    >
                      {asset.locationLabel}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center">
                  {isSelected ? (
                    <div className="h-5 w-5 rounded-full bg-[#8FA28A] text-white flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-gray-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
