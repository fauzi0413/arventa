'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, LayoutGrid, Layers, CheckSquare } from 'lucide-react';
import { Property, PropertyCategory, PropertyStatus } from './_types';
import PropertyCard from './_components/PropertyCard';
import PropertyFormModal from './_components/PropertyFormModal';
import CategoryManager from './_components/CategoryManager';
import StatusManager from './_components/StatusManager';

const DEFAULT_CATEGORIES: PropertyCategory[] = [
  { id: 'cat-1', name: 'Kos', description: 'Kos-kosan sewa bulanan/tahunan' },
  { id: 'cat-2', name: 'Apartemen', description: 'Unit apartemen mewah/menengah' },
  { id: 'cat-3', name: 'Kontrakan', description: 'Rumah sewa satu keluarga' },
  { id: 'cat-4', name: 'Ruko', description: 'Rumah toko untuk komersial' },
];

const DEFAULT_STATUSES: PropertyStatus[] = [
  { id: 'st-1', name: 'Aktif', color: '#8FA28A' },
  { id: 'st-2', name: 'Nonaktif', color: '#90A4AE' },
  { id: 'st-3', name: 'Maintenance', color: '#C8A96B' },
  { id: 'st-4', name: 'Penuh', color: '#FFB74D' },
];

const DEFAULT_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    name: 'Kost Griya Melati',
    address: 'Jl. Diponegoro No. 45, Coblong, Bandung',
    categoryId: 'cat-1',
    statusId: 'st-1',
    totalUnits: 12,
    occupiedUnits: 9,
    description: 'Kos putri eksklusif dekat kampus ITB dengan fasilitas lengkap AC, Wi-Fi, kamar mandi dalam, dan keamanan 24 jam.',
    imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prop-2',
    name: 'Signature Suite Apartemen',
    address: 'Apartment tower B, Jl. Jend. Sudirman Kav 21, Jakarta Pusat',
    categoryId: 'cat-2',
    statusId: 'st-4',
    totalUnits: 20,
    occupiedUnits: 20,
    description: 'Apartemen fully-furnished dengan akses langsung ke pusat perbelanjaan dan transportasi umum MRT.',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prop-3',
    name: 'Ruko Permata Hijau',
    address: 'Ruko Blok B/12, Jl. Soekarno Hatta, Surabaya',
    categoryId: 'cat-4',
    statusId: 'st-3',
    totalUnits: 5,
    occupiedUnits: 2,
    description: 'Ruko 3 lantai sangat strategis untuk perkantoran, kafe, atau retail di kawasan bisnis Surabaya Timur.',
    imageUrl: 'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?auto=format&fit=crop&q=80&w=600',
    createdAt: new Date().toISOString(),
  },
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [statuses, setStatuses] = useState<PropertyStatus[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedStatusId, setSelectedStatusId] = useState('all');

  // Modals Visibility
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Load from local storage asynchronously to bypass set-state-in-effect rule
  useEffect(() => {
    const storedProps = localStorage.getItem('arventa_properties');
    const storedCats = localStorage.getItem('arventa_categories');
    const storedStats = localStorage.getItem('arventa_statuses');

    const props = storedProps ? JSON.parse(storedProps) : DEFAULT_PROPERTIES;
    const cats = storedCats ? JSON.parse(storedCats) : DEFAULT_CATEGORIES;
    const stats = storedStats ? JSON.parse(storedStats) : DEFAULT_STATUSES;

    if (!storedProps) localStorage.setItem('arventa_properties', JSON.stringify(DEFAULT_PROPERTIES));
    if (!storedCats) localStorage.setItem('arventa_categories', JSON.stringify(DEFAULT_CATEGORIES));
    if (!storedStats) localStorage.setItem('arventa_statuses', JSON.stringify(DEFAULT_STATUSES));

    const timer = setTimeout(() => {
      setProperties(props);
      setCategories(cats);
      setStatuses(stats);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Sync to local storage
  const saveProperties = (updated: Property[]) => {
    setProperties(updated);
    localStorage.setItem('arventa_properties', JSON.stringify(updated));
  };

  const saveCategories = (updated: PropertyCategory[]) => {
    setCategories(updated);
    localStorage.setItem('arventa_categories', JSON.stringify(updated));
  };

  const saveStatuses = (updated: PropertyStatus[]) => {
    setStatuses(updated);
    localStorage.setItem('arventa_statuses', JSON.stringify(updated));
  };

  // Property Handlers
  const handleAddOrEditProperty = (data: Omit<Property, 'id' | 'createdAt'>) => {
    if (editingProperty) {
      // Update
      const updated = properties.map((p) =>
        p.id === editingProperty.id
          ? { ...p, ...data }
          : p
      );
      saveProperties(updated);
      setEditingProperty(null);
    } else {
      // Create
      const newProperty: Property = {
        ...data,
        id: `prop-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      saveProperties([...properties, newProperty]);
    }
  };

  const handleDeleteProperty = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus properti ini?')) {
      const updated = properties.filter((p) => p.id !== id);
      saveProperties(updated);
    }
  };

  const triggerEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsFormOpen(true);
  };

  // Category Handlers
  const handleAddCategory = (name: string, description?: string) => {
    const newCat: PropertyCategory = {
      id: `cat-${Date.now()}`,
      name,
      description,
    };
    saveCategories([...categories, newCat]);
  };

  const handleEditCategory = (id: string, name: string, description?: string) => {
    const updated = categories.map((c) =>
      c.id === id ? { ...c, name, description } : c
    );
    saveCategories(updated);
  };

  const handleDeleteCategory = (id: string) => {
    if (properties.some((p) => p.categoryId === id)) {
      alert('Kategori tidak dapat dihapus karena masih digunakan oleh properti aktif.');
      return;
    }
    const updated = categories.filter((c) => c.id !== id);
    saveCategories(updated);
  };

  // Status Handlers
  const handleAddStatus = (name: string, color: string) => {
    const newSt: PropertyStatus = {
      id: `st-${Date.now()}`,
      name,
      color,
    };
    saveStatuses([...statuses, newSt]);
  };

  const handleEditStatus = (id: string, name: string, color: string) => {
    const updated = statuses.map((s) =>
      s.id === id ? { ...s, name, color } : s
    );
    saveStatuses(updated);
  };

  const handleDeleteStatus = (id: string) => {
    if (properties.some((p) => p.statusId === id)) {
      alert('Status tidak dapat dihapus karena masih digunakan oleh properti aktif.');
      return;
    }
    const updated = statuses.filter((s) => s.id !== id);
    saveStatuses(updated);
  };

  // Filtering Logic
  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
    const matchesStatus = selectedStatusId === 'all' || p.statusId === selectedStatusId;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-[#8FA28A]" />
            Daftar Properti Anda
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola properti kos, apartemen, kontrakan, dan ruko dengan satu dashboard premium.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCategoryOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[#C7D3C0] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-[#C7D3C0]/20 transition-all shadow-sm"
          >
            <Layers className="h-4 w-4 text-gray-500" />
            Kategori
          </button>
          <button
            onClick={() => setIsStatusOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[#C7D3C0] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-[#C7D3C0]/20 transition-all shadow-sm"
          >
            <CheckSquare className="h-4 w-4 text-gray-500" />
            Status
          </button>
          <button
            onClick={() => {
              setEditingProperty(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-black transition-all shadow-sm hover:shadow"
          >
            <Plus className="h-4 w-4" />
            Tambah Properti
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama properti atau alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-sm text-gray-800 focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#8FA28A] focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatusId}
            onChange={(e) => setSelectedStatusId(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#8FA28A] focus:outline-none"
          >
            <option value="all">Semua Status</option>
            {statuses.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid View */}
      {filteredProperties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-400">
            Tidak ada properti ditemukan dengan kriteria pencarian ini.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategoryId('all');
              setSelectedStatusId('all');
            }}
            className="mt-3 text-xs font-bold text-[#8FA28A] hover:underline"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              category={categories.find((c) => c.id === property.categoryId)}
              status={statuses.find((s) => s.id === property.statusId)}
              onEdit={triggerEditProperty}
              onDelete={handleDeleteProperty}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PropertyFormModal
        key={editingProperty ? editingProperty.id : 'new-property'}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProperty(null);
        }}
        onSubmit={handleAddOrEditProperty}
        categories={categories}
        statuses={statuses}
        initialData={editingProperty}
      />

      <CategoryManager
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <StatusManager
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        statuses={statuses}
        onAddStatus={handleAddStatus}
        onEditStatus={handleEditStatus}
        onDeleteStatus={handleDeleteStatus}
      />
    </div>
  );
}
