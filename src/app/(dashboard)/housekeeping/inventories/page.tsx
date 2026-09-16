'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Armchair,
  Search,
  Filter,
  CheckCircle2,
  Wrench,
  AlertCircle,
  Plus,
  Building2,
  DoorOpen,
  ArrowRight,
  ClipboardList,
  Sparkles,
  RefreshCw,
  Eye,
  MessageCircle,
} from 'lucide-react';
import ImageFileInput from '@/app/(dashboard)/housekeeping/maintenance-reports/components/common/ImageFileInput';

interface InventoryItem {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId?: string;
  unitName: string;
  itemName: string;
  quantity: number;
  condition: 'Baik' | 'Perlu Perbaikan' | 'Rusak Berat' | 'Hilang';
  notes?: string;
  isUnitInventory: boolean;
  updatedAt: string;
}

interface PropertyOption {
  id: string;
  name: string;
}

const CONDITION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Baik: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  'Perlu Perbaikan': { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  'Rusak Berat': { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  Hilang: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
};

export default function HousekeepingInventoriesPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');

  // Quick report damage modal
  const [targetItemForDamage, setTargetItemForDamage] = useState<InventoryItem | null>(null);
  const [damageNotes, setDamageNotes] = useState('');
  const [damagePriority, setDamagePriority] = useState('HIGH');
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, propRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/properties?limit=50'),
      ]);

      if (propRes.ok) {
        const pJson = await propRes.json();
        if (Array.isArray(pJson.data)) {
          setProperties(pJson.data.map((p: any) => ({ id: p.id, name: p.name })));
        }
      }

      if (invRes.ok) {
        const iJson = await invRes.json();
        if (iJson.data?.items) {
          setItems(iJson.data.items);
        }
      }
    } catch (err) {
      console.error('Failed to load inventories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateCondition = async (item: InventoryItem, newCond: InventoryItem['condition']) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          isUnitInventory: item.isUnitInventory,
          condition: newCond,
        }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, condition: newCond, updatedAt: new Date().toISOString() } : i))
        );

        if (newCond === 'Perlu Perbaikan' || newCond === 'Rusak Berat') {
          setTargetItemForDamage({ ...item, condition: newCond });
          setDamagePhotos([]);
        }
      }
    } catch (err) {
      console.error('Failed to update condition:', err);
    }
  };

  const handleCreateDamageTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItemForDamage) return;

    setSubmittingReport(true);
    try {
      const title = `Kerusakan Barang: ${targetItemForDamage.itemName} (${targetItemForDamage.unitName})`;
      const desc = `Kondisi fisik: ${targetItemForDamage.condition}. ${damageNotes ? `Catatan staf: ${damageNotes}` : ''}`;

      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: targetItemForDamage.propertyId,
          unitId: targetItemForDamage.unitId || undefined,
          type: 'REPAIR',
          serviceType: 'INVENTORY_REPAIR',
          title,
          description: desc,
          priority: damagePriority,
          photosBefore: damagePhotos,
          costLiability: 'OWNER',
        }),
      });

      if (res.ok) {
        setTargetItemForDamage(null);
        setDamageNotes('');
        setDamagePhotos([]);
        setSuccessToast(`Tiket perbaikan untuk "${targetItemForDamage.itemName}" berhasil dibuat!`);
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setSubmittingReport(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = item.itemName.toLowerCase().includes(q);
      const matchUnit = item.unitName.toLowerCase().includes(q);
      const matchProp = item.propertyName.toLowerCase().includes(q);
      if (!matchName && !matchUnit && !matchProp) return false;
    }

    if (selectedPropertyId !== 'all' && item.propertyId !== selectedPropertyId) return false;
    if (selectedCondition !== 'all' && item.condition !== selectedCondition) return false;

    return true;
  });

  const needRepairCount = items.filter(
    (i) => i.condition === 'Perlu Perbaikan' || i.condition === 'Rusak Berat'
  ).length;

  return (
    <div className="space-y-6 bg-background min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-border">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-700 text-white shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Armchair className="h-6 w-6 text-[#8FA28A]" />
            Kondisi Perabotan & Inventaris Lapangan
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Pemeriksaan fisik aset properti, pelaporan kerusakan 1-klik, dan sinkronisasi otomatis ke tiket maintenance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-card text-card-foreground p-4 border border-border shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Total Inventaris</span>
          <p className="text-2xl font-black text-foreground">{items.length}</p>
        </div>
        <div className="rounded-2xl bg-card text-card-foreground p-4 border border-border shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Kondisi Baik</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{items.filter((i) => i.condition === 'Baik').length}</p>
        </div>
        <div className="rounded-2xl bg-card text-card-foreground p-4 border border-amber-200/60 dark:border-amber-900/60 shadow-sm space-y-1 bg-amber-50/20 dark:bg-amber-950/20">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">Perlu Perbaikan</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{needRepairCount}</p>
        </div>
        <div className="rounded-2xl bg-card text-card-foreground p-4 border border-destructive/40 shadow-sm space-y-1 bg-destructive/10">
          <span className="text-[11px] font-bold text-destructive uppercase">Rusak Berat / Hilang</span>
          <p className="text-2xl font-black text-destructive">
            {items.filter((i) => i.condition === 'Rusak Berat' || i.condition === 'Hilang').length}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-card text-card-foreground p-4 border border-border shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari barang, nomor kamar, atau nama properti..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-muted/40 text-foreground text-xs focus:outline-none focus:border-[#8FA28A]"
          />
        </div>

        <select
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-xs font-semibold bg-card text-foreground focus:outline-none"
        >
          <option value="all">Semua Properti</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={selectedCondition}
          onChange={(e) => setSelectedCondition(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-xs font-semibold bg-card text-foreground focus:outline-none"
        >
          <option value="all">Semua Kondisi</option>
          <option value="Baik">Baik</option>
          <option value="Perlu Perbaikan">Perlu Perbaikan</option>
          <option value="Rusak Berat">Rusak Berat</option>
          <option value="Hilang">Hilang</option>
        </select>
      </div>

      {/* Grid of Inventory Items */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-card border border-dashed border-border space-y-2">
          <Armchair className="h-10 w-10 text-muted-foreground/60 mx-auto" />
          <p className="text-sm font-bold text-foreground">Tidak ada data inventaris ditemukan</p>
          <p className="text-xs text-muted-foreground">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const condStyle = CONDITION_COLORS[item.condition] || CONDITION_COLORS['Baik'];
            const isDamaged = item.condition === 'Perlu Perbaikan' || item.condition === 'Rusak Berat';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-card text-card-foreground p-5 shadow-sm space-y-3 transition-all ${
                  isDamaged ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-200/50 dark:ring-amber-800/30' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase text-[#8FA28A] tracking-wider block">
                      {item.propertyName} • {item.unitName}
                    </span>
                    <h3 className="text-sm font-black text-foreground">{item.itemName}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${condStyle.bg} ${condStyle.text} ${condStyle.border}`}
                  >
                    {item.condition}
                  </span>
                </div>

                <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border">
                  <div className="flex justify-between">
                    <span>Jumlah:</span>
                    <strong className="text-foreground">{item.quantity} Unit</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Terakhir dicek:</span>
                    <span>{new Date(item.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                {/* Quick Status Setter Dropdown & Action */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <select
                    value={item.condition}
                    onChange={(e) => handleUpdateCondition(item, e.target.value as any)}
                    className="text-xs font-bold rounded-xl border border-border px-2.5 py-1.5 bg-muted/40 text-foreground focus:outline-none"
                  >
                    <option value="Baik">✓ Baik</option>
                    <option value="Perlu Perbaikan">⚠ Perlu Perbaikan</option>
                    <option value="Rusak Berat">⛔ Rusak Berat</option>
                    <option value="Hilang">✖ Hilang</option>
                  </select>

                  {isDamaged && (
                    <button
                      type="button"
                      onClick={() => setTargetItemForDamage(item)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-sm shrink-0"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      Buat Tiket Perbaikan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Quick Report Damage to Maintenance Ticket */}
      {targetItemForDamage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card text-card-foreground border border-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-black text-foreground">Buat Tiket Kerusakan Unit</h3>
              </div>
              <button
                type="button"
                onClick={() => setTargetItemForDamage(null)}
                className="text-muted-foreground hover:text-foreground text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDamageTicket} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-1 text-amber-800 dark:text-amber-300">
                <p className="font-bold">
                  Barang: {targetItemForDamage.itemName} ({targetItemForDamage.quantity} Unit)
                </p>
                <p className="text-[11px]">
                  Lokasi: {targetItemForDamage.propertyName} • {targetItemForDamage.unitName}
                </p>
                <p className="text-[11px] font-semibold">Status Fisik: {targetItemForDamage.condition}</p>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Tingkat Prioritas</label>
                <select
                  value={damagePriority}
                  onChange={(e) => setDamagePriority(e.target.value)}
                  className="w-full rounded-xl border border-border p-2.5 bg-muted/40 text-foreground font-medium focus:bg-background focus:outline-none"
                >
                  <option value="LOW">Rendah (Dapat menunggu)</option>
                  <option value="MEDIUM">Sedang (Perlu servis rutin)</option>
                  <option value="HIGH">Tinggi (Kamar tidak nyaman)</option>
                  <option value="EMERGENCY">Darurat (Berisiko membahayakan)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Keterangan / Rincian Kerusakan</label>
                <textarea
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  rows={3}
                  placeholder="Contoh: AC tidak dingin, meneteskan air ke lantai..."
                  className="w-full rounded-xl border border-border p-2.5 bg-muted/40 text-foreground font-medium focus:bg-background focus:outline-none resize-none"
                />
              </div>

              {/* Upload Foto Kerusakan */}
              <ImageFileInput
                label="Unggah Foto Kerusakan Barang"
                images={damagePhotos}
                onChange={setDamagePhotos}
                maxFiles={4}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setTargetItemForDamage(null)}
                  className="px-4 py-2 rounded-xl border border-border text-muted-foreground font-bold hover:bg-muted hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  {submittingReport ? 'Menerbitkan...' : 'Terbitkan Tiket Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
