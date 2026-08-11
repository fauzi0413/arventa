'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { PropertyStatus } from '../_types';

interface StatusManagerProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: PropertyStatus[];
  onAddStatus: (name: string, color: string) => void;
  onEditStatus: (id: string, name: string, color: string) => void;
  onDeleteStatus: (id: string) => void;
}

const PRESET_COLORS = [
  '#8FA28A', // Primary Green
  '#C8A96B', // Ochre / Yellow
  '#E57373', // Light Red
  '#64B5F6', // Light Blue
  '#81C784', // Green
  '#BA68C8', // Purple
  '#FFB74D', // Orange
  '#90A4AE', // Slate/Gray
];

export default function StatusManager({
  isOpen,
  onClose,
  statuses,
  onAddStatus,
  onEditStatus,
  onDeleteStatus,
}: StatusManagerProps) {
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;
    onAddStatus(newStatusName.trim(), newStatusColor);
    setNewStatusName('');
  };

  const startEdit = (status: PropertyStatus) => {
    setEditingId(status.id);
    setEditName(status.name);
    setEditColor(status.color);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onEditStatus(id, editName.trim(), editColor);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#F7F4ED] border border-[#C7D3C0] p-6 shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C7D3C0]/60 pb-3">
          <h3 className="text-lg font-bold text-gray-800">Kelola Status Properti</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-[#C7D3C0]/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Add Status Form */}
          <form onSubmit={handleAdd} className="space-y-2 rounded-xl bg-white p-3 border border-[#C7D3C0]/40 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tambah Status Baru</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nama Status (contoh: Aktif, Maintenance)"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-1.5 text-sm focus:border-[#8FA28A] focus:outline-none"
                required
              />

              {/* Color Picker presets */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-gray-400">Pilih Warna Badge:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewStatusColor(c)}
                      className={`h-6 w-6 rounded-full border transition-all ${
                        newStatusColor === c
                          ? 'border-gray-800 scale-110 shadow-sm ring-2 ring-[#8FA28A]/40'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-3 py-1.5 text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Tambah Status
              </button>
            </div>
          </form>

          {/* Status List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Daftar Status</h4>
            {statuses.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-4">Belum ada status yang dibuat.</p>
            ) : (
              <div className="space-y-2">
                {statuses.map((status) => (
                  <div
                    key={status.id}
                    className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm"
                  >
                    {editingId === status.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 text-gray-800 px-2 py-1 text-xs focus:border-[#8FA28A] focus:outline-none font-semibold"
                        />
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-semibold">Pilih Warna:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditColor(c)}
                                className={`h-5 w-5 rounded-full border transition-all ${
                                  editColor === c
                                    ? 'border-gray-800 scale-110 shadow-sm'
                                    : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg bg-gray-100 hover:bg-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleSaveEdit(status.id)}
                            className="flex items-center gap-0.5 rounded-lg bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-2.5 py-1 text-[11px] font-semibold transition-colors"
                          >
                            <Check className="h-3 w-3" /> Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-sm"
                            style={{ backgroundColor: status.color }}
                          >
                            {status.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <button
                            onClick={() => startEdit(status)}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteStatus(status.id)}
                            className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
