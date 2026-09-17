'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  MessageCircle,
  AlertCircle,
  Filter,
  Search,
  CheckCircle2,
  Wrench,
  Loader2,
  Package,
  Sparkles,
  Layers,
  Check,
  X,
  Info,
} from 'lucide-react';
import { InventoryItem, InventoryCondition } from '../_types';
import { Unit } from '../../units/_types';
import FacilityIcon from '@/components/common/FacilityIcon';
import { getPropertyTypeConfig } from '@/lib/utils/propertyTypeConfig';

interface InventoryManagerProps {
  propertyId: string;
  propertyName: string;
  propertyType?: string;
}

// Impure functions must be declared outside the component function body to comply with React purity rules
const generateItemId = () => `inv-${Date.now()}`;

const CONDITION_COLORS = (cond: InventoryCondition) => {
  switch (cond) {
    case 'Baik':
      return { bg: 'bg-[#8FA28A]/15 text-[#8FA28A] border-[#8FA28A]/35', icon: CheckCircle2 };
    case 'Perlu Perbaikan':
      return { bg: 'bg-[#C8A96B]/15 text-[#C8A96B] border-[#C8A96B]/35', icon: Wrench };
    case 'Rusak Berat':
      return { bg: 'bg-red-50 text-red-600 border-red-200', icon: AlertCircle };
    case 'Hilang':
      return { bg: 'bg-gray-100 text-gray-500 border-gray-200', icon: AlertCircle };
  }
};

interface CustomBatchRow {
  id: string;
  name: string;
}

export default function InventoryManager({ propertyId, propertyName, propertyType }: InventoryManagerProps) {
  const typeConfig = useMemo(() => getPropertyTypeConfig(propertyType), [propertyType]);
  const presetRecommendations = typeConfig.defaultFacilities;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Filtering & Search
  const [selectedArea, setSelectedArea] = useState<string>('all'); // 'all' | 'UNIT' | 'COMMON_AREA'
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'batch'>('batch');

  // Single Item Form State
  const [name, setName] = useState('');
  const [locationType, setLocationType] = useState<'UNIT' | 'COMMON_AREA'>('UNIT');
  const [condition, setCondition] = useState<InventoryCondition>('Baik');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Batch Form State
  const [selectedPresetItems, setSelectedPresetItems] = useState<string[]>([]);
  const [customRows, setCustomRows] = useState<CustomBatchRow[]>([]);
  const [batchLocationType, setBatchLocationType] = useState<'UNIT' | 'COMMON_AREA'>('UNIT');
  const [batchCondition, setBatchCondition] = useState<InventoryCondition>('Baik');
  const [batchError, setBatchError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load inventory strictly from API without dummy seeds
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      // Purge any old dummy seed items from localStorage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('arventa_inventory');
        if (stored) {
          try {
            const all = JSON.parse(stored);
            const cleaned = all.filter((i: any) => !String(i.id).startsWith('inv-') || !i.id.includes('-1') && !i.id.includes('-2') && !i.id.includes('-3') && !i.id.includes('-4'));
            localStorage.setItem('arventa_inventory', JSON.stringify(cleaned));
          } catch (e) {}
        }
      }

      const [invRes, propRes] = await Promise.all([
        fetch(`/api/inventory?propertyId=${propertyId}`),
        fetch(`/api/properties/${propertyId}`),
      ]);

      let dbItems: InventoryItem[] = [];
      let dbUnits: Unit[] = [];

      if (propRes.ok) {
        const json = await propRes.json();
        const p = json.data;
        if (p && Array.isArray(p.units)) {
          const statusMap: Record<string, any> = {
            AVAILABLE: 'Available',
            OCCUPIED: 'Occupied',
            MAINTENANCE: 'Maintenance',
            CLEANING: 'Need Cleaning',
          };

          dbUnits = p.units.map((u: any) => ({
            id: u.id,
            propertyId: p.id,
            name: u.unitNumber,
            status: statusMap[u.status] || 'Available',
            facilities: u.facilities || [],
            capacity: {
              maxPersons: typeof u.capacity === 'object' && u.capacity !== null ? Number(u.capacity.maxPersons || 1) : Number(u.capacity || 1),
              dimensions: typeof u.capacity === 'object' && u.capacity !== null && u.capacity.dimensions ? String(u.capacity.dimensions) : `Lantai ${u.floor || 1}`,
            },
            pricing: { monthly: Number(u.basePrice) || 1500000, deposit: 500000 },
            description: `Lantai ${u.floor || 1}`,
            createdAt: u.createdAt || new Date().toISOString(),
          }));
          setUnits(dbUnits);
        }
      }

      if (invRes.ok) {
        const invJson = await invRes.json();
        const propInvs = invJson.data?.propertyInventories || [];
        if (Array.isArray(propInvs)) {
          dbItems = propInvs.map((inv: any) => {
            const installedCount = inv.installedUnits?.length || 0;
            let locLabel = inv.locationType === 'COMMON_AREA' ? 'Area Umum' : 'Dalam Unit (Kamar)';
            if (inv.locationType === 'UNIT' && installedCount > 0) {
              const unitNames = inv.installedUnits.map((u: any) => u.unitNumber).join(', ');
              locLabel = `${installedCount} Unit (${unitNames})`;
            }

            return {
              id: inv.id,
              propertyId,
              name: inv.itemName,
              locationType: inv.locationType || 'UNIT',
              unitName: locLabel,
              condition: (inv.condition as InventoryCondition) || 'Baik',
              lastUpdated: inv.updatedAt || new Date().toISOString(),
            };
          });

          setItems(dbItems);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API fetch inventory notice:', err);
    }

    // If DB is empty or has 0 items, set items to empty array (NO dummy data)
    setItems([]);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const saveItems = (updatedItems: InventoryItem[]) => {
    // Read complete master list from storage
    const allStored = localStorage.getItem('arventa_inventory');
    let masterList: InventoryItem[] = [];
    if (allStored) {
      masterList = JSON.parse(allStored);
    }

    // Merge updates
    const merged = [
      ...masterList.filter((item) => item.propertyId !== propertyId),
      ...updatedItems,
    ];

    setItems(updatedItems);
    localStorage.setItem('arventa_inventory', JSON.stringify(merged));
  };

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const itemName = name.trim();
    if (!itemName) return;

    setIsSubmitting(true);
    const locBadge = locationType === 'COMMON_AREA' ? 'Area Umum' : 'Dalam Unit (Kamar)';

    try {
      let savedDbItem: any = null;

      if (editingId) {
        // Edit existing item via PATCH API
        try {
          const res = await fetch('/api/inventory', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingId,
              itemName,
              locationType,
              condition,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            savedDbItem = json.data;
          }
        } catch (err) {
          console.warn('API patch inventory notice:', err);
        }

        const updated = items.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: itemName,
                locationType,
                unitName: locBadge,
                condition,
                lastUpdated: new Date().toISOString(),
              }
            : item
        );
        saveItems(updated);
        setEditingId(null);
      } else {
        // Add new item via POST API
        try {
          const res = await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              propertyId,
              itemName,
              locationType,
              condition,
              quantity: 1,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            savedDbItem = json.data;
          }
        } catch (err) {
          console.warn('API post inventory notice:', err);
        }

        const newItem: InventoryItem = {
          id: savedDbItem?.id || generateItemId(),
          propertyId,
          locationType,
          unitName: locBadge,
          name: itemName,
          condition,
          lastUpdated: new Date().toISOString(),
        };
        saveItems([...items, newItem]);
      }

      await loadInventory();
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Preset Item selection in Batch Mode
  const togglePresetItem = (itemName: string) => {
    setSelectedPresetItems((prev) =>
      prev.includes(itemName) ? prev.filter((i) => i !== itemName) : [...prev, itemName]
    );
  };

  // Add Custom Row in Batch Mode
  const addCustomRow = () => {
    const newId = `crow-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setCustomRows((prev) => [...prev, { id: newId, name: '' }]);
    setTimeout(() => {
      const el = document.getElementById(newId) as HTMLInputElement | null;
      if (el) el.focus();
    }, 50);
  };

  const handleCustomRowKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIndex === customRows.length - 1) {
        addCustomRow();
      } else {
        const nextRow = customRows[rowIndex + 1];
        if (nextRow) {
          const nextEl = document.getElementById(nextRow.id) as HTMLInputElement | null;
          if (nextEl) nextEl.focus();
        }
      }
    }
  };

  const updateCustomRowName = (id: string, name: string) => {
    setCustomRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, name } : row))
    );
  };

  const removeCustomRow = (id: string) => {
    setCustomRows((prev) => prev.filter((row) => row.id !== id));
  };

  // Handle Batch Submit (Save multiple items at once)
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validCustomRows = customRows.filter((r) => r.name.trim().length > 0);
    const totalItems = selectedPresetItems.length + validCustomRows.length;

    if (totalItems === 0) {
      setBatchError('Pilih minimal 1 rekomendasi barang atau isi 1 baris barang kustom.');
      return;
    }

    setBatchError(null);
    setIsSubmitting(true);

    const payloadItems = [
      ...selectedPresetItems.map((presetName) => ({
        itemName: presetName,
        locationType: batchLocationType,
        condition: batchCondition,
        quantity: 1,
      })),
      ...validCustomRows.map((r) => ({
        itemName: r.name.trim(),
        locationType: batchLocationType,
        condition: batchCondition,
        quantity: 1,
      })),
    ];

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BATCH_CREATE',
          propertyId,
          items: payloadItems,
        }),
      });

      if (res.ok) {
        await loadInventory();
        resetForm();
      } else {
        const errJson = await res.json();
        setBatchError(errJson.message || 'Gagal menyimpan barang inventaris secara bersamaan.');
      }
    } catch (err: any) {
      console.error('Batch create inventory error:', err);
      setBatchError('Terjadi kesalahan koneksi saat menyimpan inventaris.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setLocationType('UNIT');
    setCondition('Baik');
    setSelectedPresetItems([]);
    setCustomRows([]);
    setBatchLocationType('UNIT');
    setBatchCondition('Baik');
    setBatchError(null);
    setIsAdding(false);
    setEditingId(null);
    setAddMode('batch');
  };

  // Maintenance Ticket Trigger State
  const [ticketTargetItem, setTicketTargetItem] = useState<InventoryItem | null>(null);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketPriority, setTicketPriority] = useState('MEDIUM');
  const [ticketCostLiability, setTicketCostLiability] = useState('OWNER');
  const [ticketEstCost, setTicketEstCost] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccessToast, setTicketSuccessToast] = useState<string | null>(null);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const triggerEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setName(item.name);
    setLocationType(item.locationType === 'COMMON_AREA' ? 'COMMON_AREA' : 'UNIT');
    setCondition(item.condition);
    setAddMode('single');
    setIsAdding(true);
  };

  const toggleSelectForDelete = (id: string) => {
    setSelectedDeleteIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllForDelete = () => {
    setSelectedDeleteIds(displayItems.map((item) => item.id));
  };

  const clearDeleteSelection = () => {
    setSelectedDeleteIds([]);
  };

  const handleExecuteBulkDelete = async () => {
    if (selectedDeleteIds.length === 0) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/inventory?ids=${selectedDeleteIds.join(',')}`, {
        method: 'DELETE',
      });
      const updated = items.filter((item) => !selectedDeleteIds.includes(item.id));
      saveItems(updated);
      setTicketSuccessToast(`${selectedDeleteIds.length} barang inventaris berhasil dihapus.`);
      setTimeout(() => setTicketSuccessToast(null), 3000);
    } catch (err) {
      console.warn('API delete inventory notice:', err);
    } finally {
      setIsDeleting(false);
      setSelectedDeleteIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleQuickConditionUpdate = async (id: string, newCond: InventoryCondition) => {
    try {
      await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          condition: newCond,
        }),
      });
    } catch (err) {
      console.warn('API patch inventory notice:', err);
    }

    const updated = items.map((item) =>
      item.id === id
        ? { ...item, condition: newCond, lastUpdated: new Date().toISOString() }
        : item
    );
    saveItems(updated);

    if (newCond === 'Perlu Perbaikan' || newCond === 'Rusak Berat') {
      const updatedTarget = updated.find((i) => i.id === id);
      if (updatedTarget) {
        openTicketModal(updatedTarget);
      }
    }
  };

  const openTicketModal = (item: InventoryItem) => {
    setTicketTargetItem(item);
    const loc = item.locationType === 'COMMON_AREA' ? 'Area Umum' : 'Dalam Unit';
    setTicketTitle(`Perbaikan ${item.name} (${loc})`);
    setTicketDesc(`Kondisi fisik barang: ${item.condition}. Ditemukan saat inspeksi properti ${propertyName}.`);
    setTicketPriority(item.condition === 'Rusak Berat' ? 'HIGH' : 'MEDIUM');
    setTicketCostLiability('OWNER');
    setTicketEstCost('');
  };

  const handleSubmitMaintenanceTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTargetItem) return;

    setIsSubmittingTicket(true);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          type: 'REPAIR',
          serviceType: 'INVENTORY_REPAIR',
          title: ticketTitle,
          description: ticketDesc,
          priority: ticketPriority,
          costLiability: ticketCostLiability,
          estimatedCost: ticketEstCost ? Number(ticketEstCost) : undefined,
        }),
      });

      if (res.ok) {
        setTicketTargetItem(null);
        setTicketSuccessToast(`Tiket perbaikan "${ticketTitle}" berhasil dibuat dan tersambung ke database!`);
        setTimeout(() => setTicketSuccessToast(null), 4000);
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal membuat tiket maintenance');
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const sendWhatsAppReport = (item: InventoryItem) => {
    const locText = item.locationType === 'COMMON_AREA' ? '*Area Umum*' : '*Dalam Unit / Kamar*';
    const message = `Halo, Laporan Kondisi Inventaris Properti *${propertyName}*:\n\n` +
      `Barang: *${item.name}*\n` +
      `Area Penempatan: ${locText}\n` +
      `Kondisi: *${item.condition}*\n` +
      `Terakhir Diupdate: ${new Date(item.lastUpdated).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `Mohon segera ditindaklanjuti. Terima kasih.`;

    const waUrl = `https://wa.me/6281383544440?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Area Counts for Filters
  const areaCounts = useMemo(() => {
    const unit = items.filter((i) => !i.locationType || i.locationType === 'UNIT').length;
    const common = items.filter((i) => i.locationType === 'COMMON_AREA').length;
    return {
      all: items.length,
      unit,
      common,
    };
  }, [items]);

  // Filter Logic per Area & Search Query
  const displayItems = useMemo(() => {
    return items.filter((item) => {
      // Area Placement Filter
      const matchArea =
        selectedArea === 'all'
          ? true
          : selectedArea === 'UNIT'
          ? !item.locationType || item.locationType === 'UNIT'
          : item.locationType === 'COMMON_AREA';

      // Search Query Filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.condition && item.condition.toLowerCase().includes(q));

      return matchArea && matchSearch;
    });
  }, [items, selectedArea, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Filters & Actions Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-card dark:border-border p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari fasilitas inventaris (misal: AC, Kasur, Lemari)..."
              className="w-full rounded-xl border border-border bg-background text-foreground pl-9.5 pr-8 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none shadow-2xs placeholder:text-muted-foreground transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md transition-colors cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Area Placement Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full sm:w-auto">
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-2xs focus-within:border-[#8FA28A]">
                <Filter className="h-3.5 w-3.5 text-[#8FA28A] shrink-0" />
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-2"
                >
                  <option value="all" className="bg-card text-foreground">
                    Semua Area Penempatan ({areaCounts.all})
                  </option>
                  <option value="UNIT" className="bg-card text-foreground">
                    Dalam Unit (Kamar) ({areaCounts.unit})
                  </option>
                  <option value="COMMON_AREA" className="bg-card text-foreground">
                    Area Umum (Bersama) ({areaCounts.common})
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Add Trigger */}
        {!isAdding && (
          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              onClick={() => setIsAdding(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-black transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Fasilitas</span>
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Form Block */}
      {isAdding && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200 text-card-foreground">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-[#8FA28A]" />
                {editingId
                  ? 'Ubah Data Fasilitas'
                  : addMode === 'batch'
                  ? 'Tambah Banyak Fasilitas Sekaligus (Batch)'
                  : 'Tambah Fasilitas Satuan'}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {editingId
                  ? 'Perbarui spesifikasi atau kondisi fasilitas inventaris'
                  : addMode === 'batch'
                  ? 'Centang pilihan cepat atau tambahkan daftar fasilitas untuk disimpan sekaligus'
                  : 'Isi detail 1 fasilitas properti'}
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Selector Tabs (only when creating, not editing) */}
          {!editingId && (
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/60 rounded-xl mb-4 text-xs font-bold border border-border">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setAddMode('batch')}
                className={`min-h-[42px] py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  addMode === 'batch'
                    ? 'bg-[#8FA28A] text-white shadow-sm font-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Tambah Banyak Fasilitas (Batch)
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setAddMode('single')}
                className={`min-h-[42px] py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  addMode === 'single'
                    ? 'bg-card text-foreground shadow-sm font-black border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Plus className="h-4 w-4 text-[#8FA28A]" />
                Input Satuan (1 Fasilitas)
              </button>
            </div>
          )}

          {/* BATCH MODE FORM */}
          {addMode === 'batch' && !editingId ? (
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              {batchError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{batchError}</span>
                </div>
              )}

              {/* Global Placement & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-muted/30 border border-border">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Area Penempatan Default *
                  </label>
                  <select
                    disabled={isSubmitting}
                    value={batchLocationType}
                    onChange={(e) => setBatchLocationType(e.target.value as 'UNIT' | 'COMMON_AREA')}
                    className="w-full rounded-xl border border-border bg-background text-foreground px-3.5 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="UNIT">Dalam Unit (Inventaris Kamar/Unit)</option>
                    <option value="COMMON_AREA">Area Umum (Fasilitas Bersama)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Kondisi Awal Fasilitas *
                  </label>
                  <select
                    disabled={isSubmitting}
                    value={batchCondition}
                    onChange={(e) => setBatchCondition(e.target.value as InventoryCondition)}
                    className="w-full rounded-xl border border-border bg-background text-foreground px-3.5 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                    <option value="Hilang">Hilang</option>
                  </select>
                </div>
              </div>

              {/* Preset Recommendations Checklist */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#8FA28A]" />
                    <span>Pilih Cepat Rekomendasi Fasilitas ({typeConfig.badgeLabel})</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setSelectedPresetItems(presetRecommendations)}
                      className="text-[11px] font-bold text-[#8FA28A] hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-muted-foreground text-xs">•</span>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setSelectedPresetItems([])}
                      className="text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Batal Pilih
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {presetRecommendations.map((item) => {
                    const isSelected = selectedPresetItems.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => togglePresetItem(item)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'border-[#8FA28A] bg-[#8FA28A]/10 text-foreground font-bold shadow-2xs'
                            : 'border-border bg-card text-muted-foreground font-semibold hover:border-[#8FA28A]/50 hover:bg-muted/30 hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background border border-border text-[#8FA28A]">
                            <FacilityIcon name={item} className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate">{item}</span>
                        </div>
                        <div className="shrink-0 pl-1.5">
                          {isSelected ? (
                            <div className="h-4 w-4 rounded-full bg-[#8FA28A] text-white flex items-center justify-center shadow-xs">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-border bg-card" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Multi-Row Items */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-[#8FA28A]" />
                    <span>Fasilitas Kustom Tambahan (Opsional)</span>
                  </label>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={addCustomRow}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8FA28A]/15 text-[#8FA28A] border border-[#8FA28A]/30 text-[11px] font-bold hover:bg-[#8FA28A]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                {customRows.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic py-1">
                    Belum ada fasilitas kustom tambahan. Klik "+ Tambah Baris" jika ingin mengetik fasilitas lain.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {customRows.map((row, idx) => (
                      <div key={row.id} className="flex items-center gap-2">
                        <input
                          id={row.id}
                          type="text"
                          disabled={isSubmitting}
                          value={row.name}
                          onChange={(e) => updateCustomRowName(row.id, e.target.value)}
                          onKeyDown={(e) => handleCustomRowKeyDown(e, idx)}
                          placeholder="Tulis nama fasilitas (misal: Dispenser Galon, Kipas Angin... lalu tekan Enter)"
                          className="flex-1 rounded-xl border border-border bg-background text-foreground px-3 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => removeCustomRow(row.id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Hapus baris"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary & Submit Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-[#8FA28A] shrink-0" />
                  <span>
                    Total: <strong className="text-foreground">{selectedPresetItems.length + customRows.filter((r) => r.name.trim()).length}</strong> fasilitas inventaris siap ditambahkan
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || (selectedPresetItems.length === 0 && customRows.filter((r) => r.name.trim()).length === 0)}
                    className="rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-5 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[160px] justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        <span>Menyimpan Semua...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Simpan Semua ({selectedPresetItems.length + customRows.filter((r) => r.name.trim()).length} Fasilitas)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* SINGLE MODE FORM */
            <form onSubmit={handleAddOrEdit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Item Direct Text Input */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Nama Fasilitas *</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tulis nama fasilitas (misal: AC, Kasur, Lemari...)"
                    className="w-full rounded-xl border border-border bg-background text-foreground px-3 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Area Placement Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Area Penempatan *</label>
                  <select
                    disabled={isSubmitting}
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as 'UNIT' | 'COMMON_AREA')}
                    className="w-full rounded-xl border border-border bg-background text-foreground px-3 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="UNIT">Dalam Unit (Inventaris Kamar/Unit)</option>
                    <option value="COMMON_AREA">Area Umum (Fasilitas Bersama)</option>
                  </select>
                </div>

                {/* Initial Condition Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Kondisi Awal *</label>
                  <select
                    disabled={isSubmitting}
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as InventoryCondition)}
                    className="w-full rounded-xl border border-border bg-background text-foreground px-3 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                    <option value="Hilang">Hilang</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground px-4 py-2 text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-5 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingId ? 'Simpan Perubahan' : 'Tambah Fasilitas'}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}


      {/* Bulk Delete Action Banner */}
      {selectedDeleteIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3 text-rose-700 dark:text-rose-300">
            <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-900/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Trash2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                {selectedDeleteIds.length} Fasilitas Dipilih untuk Dihapus
              </p>
              <p className="text-[11px] text-rose-600/75 dark:text-rose-400/75 mt-0.5">
                Pilih fasilitas lain atau klik konfirmasi untuk menghapus secara bersamaan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {selectedDeleteIds.length < displayItems.length ? (
              <button
                type="button"
                onClick={selectAllForDelete}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-card text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
              >
                Pilih Semua ({displayItems.length})
              </button>
            ) : (
              <button
                type="button"
                onClick={clearDeleteSelection}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-card text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
              >
                Batal Pilih Semua
              </button>
            )}

            <button
              type="button"
              onClick={clearDeleteSelection}
              className="px-3 py-1.5 rounded-xl border border-border bg-white dark:bg-card text-muted-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Konfirmasi Hapus ({selectedDeleteIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid of Items */}
      {loading ? (
        <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-[#C7D3C0] bg-white dark:bg-card p-8 shadow-xs">
          <div className="text-center space-y-2.5">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#8FA28A] border-t-transparent mx-auto" />
            <p className="text-xs text-gray-500 font-bold">Memuat fasilitas inventaris...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white dark:bg-card p-12 text-center shadow-xs space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#8FA28A]/10 text-[#8FA28A] flex items-center justify-center">
            <Package className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-gray-800 dark:text-gray-100">Belum Ada Fasilitas Terdaftar</h5>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Belum ada data fasilitas untuk properti ini. Tambahkan fasilitas baru untuk area umum atau fasilitas dalam unit.
            </p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Tambah Fasilitas Pertama
            </button>
          )}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white dark:bg-card p-12 text-center shadow-xs space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
            <Search className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-foreground">Fasilitas Tidak Ditemukan</h5>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Tidak ada fasilitas inventaris yang sesuai dengan kata kunci &quot;{searchQuery}&quot;
              {selectedArea !== 'all' ? ` di area ${selectedArea === 'UNIT' ? 'Dalam Unit (Kamar)' : 'Area Umum'}` : ''}.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedArea('all');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground px-4 py-2 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
            Reset Pencarian & Filter
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayItems.map((item: InventoryItem) => {
            const condStyle = CONDITION_COLORS(item.condition);
            const CondIcon = condStyle.icon;
            const isCommonArea = item.locationType === 'COMMON_AREA';
            const badgeText = isCommonArea
              ? 'Area Umum'
              : item.unitName && item.unitName.includes('Unit')
                ? item.unitName
                : 'Dalam Unit (Kamar)';
            const badgeClass = isCommonArea
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25'
              : 'bg-[#8FA28A]/10 text-[#8FA28A] border-[#8FA28A]/25';

            const isSelectedForDelete = selectedDeleteIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`group flex flex-col justify-between rounded-2xl border transition-all p-4 shadow-xs hover:shadow-md ${
                  isSelectedForDelete
                    ? 'border-rose-400 dark:border-rose-700 bg-rose-50/25 dark:bg-rose-950/25 ring-2 ring-rose-400/30'
                    : 'border-gray-200 bg-white dark:bg-card dark:border-border'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Clean SVG Facility Icon */}
                  <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center shadow-xs transition-colors ${
                    isSelectedForDelete
                      ? 'bg-rose-500 text-white'
                      : 'bg-[#8FA28A]/10 text-[#8FA28A] border border-[#8FA28A]/25'
                  }`}>
                    <FacilityIcon name={item.name} className="h-5 w-5 stroke-[2.2]" />
                  </div>

                  {/* Info details */}
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <h5 className="font-bold text-gray-800 dark:text-gray-100 truncate text-sm">{item.name}</h5>
                        {isSelectedForDelete && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500 text-white shrink-0">
                            Dipilih
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full border ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${condStyle.bg}`}>
                        <CondIcon className="h-3 w-3" />
                        {item.condition}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Update: {new Date(item.lastUpdated).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Condition Quick Changers & Laporan WA (SCRUM-41) */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {/* Quick state changers */}
                  <div className="flex flex-wrap gap-1">
                    {(['Baik', 'Perlu Perbaikan', 'Rusak Berat', 'Hilang'] as InventoryCondition[]).map((condOpt) => (
                      <button
                        key={condOpt}
                        onClick={() => handleQuickConditionUpdate(item.id, condOpt)}
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition-colors ${
                          item.condition === condOpt
                            ? 'bg-[#8FA28A] text-white border-transparent'
                            : 'bg-white dark:bg-card text-gray-500 border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-muted'
                        }`}
                      >
                        {condOpt}
                      </button>
                    ))}
                  </div>

                  {/* WhatsApp send button & Edit/Delete actions */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0 self-end">
                    <button
                      onClick={() => triggerEdit(item)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                      title="Ubah Fasilitas"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSelectForDelete(item.id)}
                      className={`rounded-lg p-1.5 transition-all cursor-pointer ${
                        isSelectedForDelete
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50'
                      }`}
                      title={isSelectedForDelete ? 'Batalkan pilihan hapus' : 'Pilih untuk hapus fasilitas (Bulk)'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Show quick maintenance ticket trigger & WA notification triggers for damaged items */}
                    {(item.condition === 'Perlu Perbaikan' || item.condition === 'Rusak Berat') && (
                      <button
                        onClick={() => openTicketModal(item)}
                        className="flex items-center gap-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 px-2 py-1 text-[10px] font-bold shadow-sm transition-colors"
                        title="Buat Tiket Perbaikan Unit"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        Tiket Perbaikan
                      </button>
                    )}

                    {(item.condition === 'Perlu Perbaikan' || item.condition === 'Rusak Berat' || item.condition === 'Hilang') && (
                      <button
                        onClick={() => sendWhatsAppReport(item)}
                        className="flex items-center gap-0.5 rounded-lg bg-[#25D366] text-white hover:bg-[#20ba5a] px-2 py-1 text-[10px] font-bold shadow-sm transition-colors"
                        title="Kirim Laporan via WA"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Laporkan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Success Toast */}
      {ticketSuccessToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-700 text-white shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5" />
          <span>{ticketSuccessToast}</span>
        </div>
      )}

      {/* Modal: Direct Create Maintenance Ticket from Inventory */}
      {ticketTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-black text-gray-800">Buat Tiket Perbaikan Unit</h3>
              </div>
              <button
                type="button"
                onClick={() => setTicketTargetItem(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitMaintenanceTicket} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-800">
                <p className="font-bold">
                  Barang: {ticketTargetItem.name}
                </p>
                <p className="text-[11px]">
                  Lokasi: {propertyName} • {ticketTargetItem.unitName ? `Kamar ${ticketTargetItem.unitName}` : 'Area Umum'}
                </p>
                <p className="text-[11px] font-semibold">Status Fisik: {ticketTargetItem.condition}</p>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Judul Perbaikan *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmittingTicket}
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Prioritas</label>
                  <select
                    disabled={isSubmittingTicket}
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="LOW">Rendah</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HIGH">Tinggi (Urgent)</option>
                    <option value="EMERGENCY">Darurat</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Beban Biaya</label>
                  <select
                    disabled={isSubmittingTicket}
                    value={ticketCostLiability}
                    onChange={(e) => setTicketCostLiability(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="TENANT">Penyewa</option>
                    <option value="SPLIT">Split</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Estimasi Biaya (Rp)</label>
                <input
                  type="number"
                  disabled={isSubmittingTicket}
                  value={ticketEstCost}
                  onChange={(e) => setTicketEstCost(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Keterangan Tambahan</label>
                <textarea
                  disabled={isSubmittingTicket}
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  disabled={isSubmittingTicket}
                  onClick={() => setTicketTargetItem(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingTicket ? 'Menerbitkan...' : 'Terbitkan Tiket Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && selectedDeleteIds.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-card text-foreground p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-rose-200 dark:border-rose-900/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Hapus {selectedDeleteIds.length} Fasilitas?</h3>
                <p className="text-xs text-muted-foreground">Tindakan ini permanen dan tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/40 p-3 border border-border text-xs space-y-2 max-h-48 overflow-y-auto">
              <p className="font-semibold text-foreground mb-1">Daftar fasilitas yang akan dihapus:</p>
              <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
                {items
                  .filter((i) => selectedDeleteIds.includes(i.id))
                  .map((i) => (
                    <li key={i.id} className="truncate">
                      <strong className="text-foreground">{i.name}</strong>{' '}
                      <span className="text-[11px] opacity-75">
                        ({i.locationType === 'COMMON_AREA' ? 'Area Umum' : 'Dalam Unit'})
                      </span>
                    </li>
                  ))}
              </ul>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{selectedDeleteIds.length}</strong> fasilitas inventaris terpilih ini dari daftar properti?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-muted-foreground text-xs font-bold hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    <span>Menghapus {selectedDeleteIds.length} Fasilitas...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Ya, Hapus ({selectedDeleteIds.length}) Fasilitas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

