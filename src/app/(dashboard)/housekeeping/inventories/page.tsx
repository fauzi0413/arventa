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
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-700 text-white shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#C7D3C0]/30 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Armchair className="h-6 w-6 text-[#8FA28A]" />
            Kondisi Perabotan & Inventaris Lapangan
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Pemeriksaan fisik aset properti, pelaporan kerusakan 1-klik, dan sinkronisasi otomatis ke tiket maintenance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white p-4 border border-[#C7D3C0]/30 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Total Inventaris</span>
          <p className="text-2xl font-black text-gray-800">{items.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 border border-[#C7D3C0]/30 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Kondisi Baik</span>
          <p className="text-2xl font-black text-emerald-600">{items.filter((i) => i.condition === 'Baik').length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 border border-amber-200 shadow-sm space-y-1 bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-600 uppercase">Perlu Perbaikan</span>
          <p className="text-2xl font-black text-amber-600">{needRepairCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 border border-red-200 shadow-sm space-y-1 bg-red-50/20">
          <span className="text-[11px] font-bold text-red-600 uppercase">Rusak Berat / Hilang</span>
          <p className="text-2xl font-black text-red-600">
            {items.filter((i) => i.condition === 'Rusak Berat' || i.condition === 'Hilang').length}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white p-4 border border-[#C7D3C0]/30 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari barang, nomor kamar, atau nama properti..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#8FA28A]"
          />
        </div>

        <select
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 focus:bg-white focus:outline-none"
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
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 focus:bg-white focus:outline-none"
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
        <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-gray-200 space-y-2">
          <Armchair className="h-10 w-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">Tidak ada data inventaris ditemukan</p>
          <p className="text-xs text-gray-400">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const condStyle = CONDITION_COLORS[item.condition] || CONDITION_COLORS['Baik'];
            const isDamaged = item.condition === 'Perlu Perbaikan' || item.condition === 'Rusak Berat';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm space-y-3 transition-all ${
                  isDamaged ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-[#C7D3C0]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase text-[#8FA28A] tracking-wider block">
                      {item.propertyName} • {item.unitName}
                    </span>
                    <h3 className="text-sm font-black text-gray-800">{item.itemName}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${condStyle.bg} ${condStyle.text} ${condStyle.border}`}
                  >
                    {item.condition}
                  </span>
                </div>

                <div className="text-[11px] text-gray-500 space-y-1 pt-1 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span>Jumlah:</span>
                    <strong className="text-gray-700">{item.quantity} Unit</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Terakhir dicek:</span>
                    <span>{new Date(item.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                {/* Quick Status Setter Dropdown & Action */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <select
                    value={item.condition}
                    onChange={(e) => handleUpdateCondition(item, e.target.value as any)}
                    className="text-xs font-bold rounded-xl border border-gray-200 px-2.5 py-1.5 bg-gray-50 focus:bg-white focus:outline-none"
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-black text-gray-800">Buat Tiket Kerusakan Unit</h3>
              </div>
              <button
                type="button"
                onClick={() => setTargetItemForDamage(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDamageTicket} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-800">
                <p className="font-bold">
                  Barang: {targetItemForDamage.itemName} ({targetItemForDamage.quantity} Unit)
                </p>
                <p className="text-[11px]">
                  Lokasi: {targetItemForDamage.propertyName} • {targetItemForDamage.unitName}
                </p>
                <p className="text-[11px] font-semibold">Status Fisik: {targetItemForDamage.condition}</p>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tingkat Prioritas</label>
                <select
                  value={damagePriority}
                  onChange={(e) => setDamagePriority(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none"
                >
                  <option value="LOW">Rendah (Dapat menunggu)</option>
                  <option value="MEDIUM">Sedang (Perlu servis rutin)</option>
                  <option value="HIGH">Tinggi (Kamar tidak nyaman)</option>
                  <option value="EMERGENCY">Darurat (Berisiko membahayakan)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Keterangan / Rincian Kerusakan</label>
                <textarea
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  rows={3}
                  placeholder="Contoh: AC tidak dingin, meneteskan air ke lantai..."
                  className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {/* Upload Foto Kerusakan */}
              <ImageFileInput
                label="Unggah Foto Kerusakan Barang"
                images={damagePhotos}
                onChange={setDamagePhotos}
                maxFiles={4}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setTargetItemForDamage(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
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
