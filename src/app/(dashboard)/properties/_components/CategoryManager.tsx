'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { PropertyCategory } from '../_types';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: PropertyCategory[];
  onAddCategory: (name: string, description?: string) => void;
  onEditCategory: (id: string, name: string, description?: string) => void;
  onDeleteCategory: (id: string) => void;
}

export default function CategoryManager({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim(), newCatDesc.trim());
    setNewCatName('');
    setNewCatDesc('');
  };

  const startEdit = (cat: PropertyCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onEditCategory(id, editName.trim(), editDesc.trim());
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#F7F4ED] border border-[#C7D3C0] p-6 shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C7D3C0]/60 pb-3">
          <h3 className="text-lg font-bold text-gray-800">Kelola Kategori Properti</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-[#C7D3C0]/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Add Form */}
          <form onSubmit={handleAdd} className="space-y-2 rounded-xl bg-white p-3 border border-[#C7D3C0]/40 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tambah Kategori Baru</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nama Kategori (contoh: Kos, Apartemen)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-1.5 text-sm focus:border-[#8FA28A] focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Deskripsi singkat (opsional)"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-1.5 text-sm focus:border-[#8FA28A] focus:outline-none"
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-3 py-1.5 text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Tambah Kategori
              </button>
            </div>
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Daftar Kategori</h4>
            {categories.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-4">Belum ada kategori yang dibuat.</p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm"
                  >
                    {editingId === cat.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 text-gray-800 px-2 py-1 text-xs focus:border-[#8FA28A] focus:outline-none font-semibold"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 text-gray-800 px-2 py-1 text-xs focus:border-[#8FA28A] focus:outline-none"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg bg-gray-100 hover:bg-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleSaveEdit(cat.id)}
                            className="flex items-center gap-0.5 rounded-lg bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-2.5 py-1 text-[11px] font-semibold transition-colors"
                          >
                            <Check className="h-3 w-3" /> Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                          {cat.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <button
                            onClick={() => startEdit(cat)}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteCategory(cat.id)}
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
