'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, MessageCircle, AlertCircle, Filter, CheckCircle2, Wrench } from 'lucide-react';
import { InventoryItem, InventoryCondition } from '../_types';
import PhotoUploader from './PhotoUploader';
import { Unit } from '../../units/_types';

interface InventoryManagerProps {
  propertyId: string;
  propertyName: string;
}

const PREDEFINED_ITEMS = ['AC', 'Kasur Springbed', 'Lemari Pakaian', 'TV', 'Water Heater', 'Kulkas Mini', 'Meja Belajar'];

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

export default function InventoryManager({ propertyId, propertyName }: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Filtering
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [customName, setCustomName] = useState('');
  const [unitId, setUnitId] = useState(''); // Empty = Area Umum
  const [condition, setCondition] = useState<InventoryCondition>('Baik');
  const [imageUrl, setImageUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load from localStorage asynchronously
  useEffect(() => {
    const storedItems = localStorage.getItem('arventa_inventory');
    const storedUnits = localStorage.getItem('arventa_units');

    let loadedItems: InventoryItem[] = [];
    if (storedItems) {
      loadedItems = JSON.parse(storedItems);
    } else {
      // Seed default items
      loadedItems = [
        {
          id: 'inv-1',
          propertyId,
          unitId: 'unit-1',
          unitName: 'Kamar 101',
          name: 'AC',
          condition: 'Baik',
          imageUrl: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&q=80&w=200',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'inv-2',
          propertyId,
          unitId: 'unit-2',
          unitName: 'Kamar 102',
          name: 'Kasur Springbed',
          condition: 'Perlu Perbaikan',
          imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=200',
          lastUpdated: new Date().toISOString(),
        },
      ];
      localStorage.setItem('arventa_inventory', JSON.stringify(loadedItems));
    }

    let loadedUnits: Unit[] = [];
    if (storedUnits) {
      loadedUnits = JSON.parse(storedUnits).filter((u: Unit) => u.propertyId === propertyId);
    }

    const timer = setTimeout(() => {
      setItems(loadedItems.filter((item) => item.propertyId === propertyId));
      setUnits(loadedUnits);
    }, 0);

    return () => clearTimeout(timer);
  }, [propertyId]);

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

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemName = name === 'Lainnya' ? customName.trim() : name;
    if (!itemName) return;

    const assignedUnit = units.find((u) => u.id === unitId);

    if (editingId) {
      // Edit
      const updated = items.map((item) =>
        item.id === editingId
          ? {
              ...item,
              name: itemName,
              unitId: unitId || undefined,
              unitName: assignedUnit ? assignedUnit.name : undefined,
              condition,
              imageUrl: imageUrl || undefined,
              lastUpdated: new Date().toISOString(),
            }
          : item
      );
      saveItems(updated);
      setEditingId(null);
    } else {
      // Add
      const newItem: InventoryItem = {
        id: generateItemId(),
        propertyId,
        unitId: unitId || undefined,
        unitName: assignedUnit ? assignedUnit.name : undefined,
        name: itemName,
        condition,
        imageUrl: imageUrl || undefined,
        lastUpdated: new Date().toISOString(),
      };
      saveItems([...items, newItem]);
    }

    resetForm();
  };

  const resetForm = () => {
    setName(PREDEFINED_ITEMS[0]);
    setCustomName('');
    setUnitId('');
    setCondition('Baik');
    setImageUrl('');
    setIsAdding(false);
    setEditingId(null);
  };

  const triggerEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setName(PREDEFINED_ITEMS.includes(item.name) ? item.name : 'Lainnya');
    setCustomName(PREDEFINED_ITEMS.includes(item.name) ? '' : item.name);
    setUnitId(item.unitId || '');
    setCondition(item.condition);
    setImageUrl(item.imageUrl || '');
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus inventaris ini?')) {
      const updated = items.filter((item) => item.id !== id);
      saveItems(updated);
    }
  };

  const handleQuickConditionUpdate = (id: string, newCond: InventoryCondition) => {
    const updated = items.map((item) =>
      item.id === id
        ? { ...item, condition: newCond, lastUpdated: new Date().toISOString() }
        : item
    );
    saveItems(updated);
  };

  const sendWhatsAppReport = (item: InventoryItem) => {
    const unitText = item.unitName ? `kamar *${item.unitName}*` : '*Area Umum*';
    const message = `Halo, Laporan Kondisi Inventaris Properti *${propertyName}*:\n\n` +
      `Barang: *${item.name}*\n` +
      `Lokasi: ${unitText}\n` +
      `Kondisi: *${item.condition}*\n` +
      `Terakhir Diupdate: ${new Date(item.lastUpdated).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `Mohon segera ditindaklanjuti. Terima kasih.`;

    const waUrl = `https://wa.me/6281383544440?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Filter Logic
  const filteredItems = items.filter((item) => {
    if (selectedUnitId === 'all') return true;
    if (selectedUnitId === 'umum') return !item.unitId;
    return item.unitId === selectedUnitId;
  });

  return (
    <div className="space-y-6">
      {/* Filters & Actions Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#C7D3C0]/40 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Unit Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#8FA28A] focus:outline-none"
          >
            <option value="all">Semua Lokasi / Kamar</option>
            <option value="umum">Area Umum (Luar Kamar)</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Trigger */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-black transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Tambah Barang
          </button>
        )}
      </div>

      {/* Add / Edit Form Block */}
      {isAdding && (
        <form onSubmit={handleAddOrEdit} className="rounded-2xl border border-[#C7D3C0]/60 bg-white p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {editingId ? 'Ubah Inventaris' : 'Tambah Inventaris Baru'}
            </h4>
            <button type="button" onClick={resetForm} className="text-xs text-gray-400 hover:text-gray-600 font-semibold">
              Batal
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Item Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Barang *</label>
              <select
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              >
                {PREDEFINED_ITEMS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
              </select>
            </div>

            {/* Custom Write-in Name */}
            {name === 'Lainnya' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tulis Nama Barang *</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Contoh: Kipas Angin"
                  className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
                />
              </div>
            )}

            {/* Room Assignment Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Penempatan Unit</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              >
                <option value="">Area Umum (Luar Kamar)</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Initial Condition Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Kondisi Awal *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as InventoryCondition)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:border-[#8FA28A] focus:outline-none"
              >
                <option value="Baik">Baik</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                <option value="Rusak Berat">Rusak Berat</option>
                <option value="Hilang">Hilang</option>
              </select>
            </div>
          </div>

          {/* Photo Uploader Component (SCRUM-40) */}
          <PhotoUploader value={imageUrl} onChange={setImageUrl} />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
            >
              Simpan Barang
            </button>
          </div>
        </form>
      )}

      {/* Grid of Items */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-400">Tidak ada barang inventaris terdaftar untuk filter ini.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredItems.map((item) => {
            const condStyle = CONDITION_COLORS(item.condition);
            const CondIcon = condStyle.icon;
            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Photo Thumbnail */}
                  <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-gray-300 font-bold uppercase bg-gray-50">
                        N/A
                      </div>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-gray-800 truncate">{item.name}</h5>
                      <span className="text-[10px] text-gray-400 font-semibold shrink-0">
                        {item.unitName ? `Unit: ${item.unitName}` : 'Area Umum'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${condStyle.bg}`}>
                        <CondIcon className="h-3 w-3" />
                        {item.condition}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-400 font-medium">
                      Update: {new Date(item.lastUpdated).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Condition Quick Changers & Laporan WA (SCRUM-41) */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {/* Quick state changers */}
                  <div className="flex flex-wrap gap-1">
                    {(['Baik', 'Perlu Perbaikan', 'Rusak Berat', 'Hilang'] as InventoryCondition[]).map((condOpt) => (
                      <button
                        key={condOpt}
                        onClick={() => handleQuickConditionUpdate(item.id, condOpt)}
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition-colors ${
                          item.condition === condOpt
                            ? 'bg-[#8FA28A] text-white border-transparent'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
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
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title="Ubah Barang"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Hapus Barang"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Show WA notification triggers for damaged items */}
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
    </div>
  );
}
