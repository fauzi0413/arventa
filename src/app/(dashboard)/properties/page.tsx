'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, LayoutGrid, Layers, CheckSquare, RefreshCw } from 'lucide-react';
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

const DEFAULT_PROPERTIES: Property[] = [];

function mapApiPropertyToFrontend(p: any): Property {
  const typeToCat: Record<string, string> = {
    KOS: 'cat-1',
    APARTEMEN: 'cat-2',
    KONTRAKAN: 'cat-3',
    RUKO: 'cat-4',
  };

  const categoryId = typeToCat[p.type] || 'cat-1';
  const units = p.units || [];
  const totalUnits = p._count?.units || units.length || 0;
  const occupiedUnits = units.filter((u: any) => u.status === 'OCCUPIED' || u.status === 'Occupied').length;
  const statusId = (totalUnits > 0 && occupiedUnits === totalUnits) ? 'st-4' : 'st-1';

  return {
    id: p.id,
    name: p.name,
    address: `${p.address}${p.city ? `, ${p.city}` : ''}`,
    categoryId,
    statusId,
    totalUnits,
    occupiedUnits,
    description: p.description || '',
    imageUrl: p.coverImage || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600',
    hasCleaningService: p.hasCleaningService ?? true,
    createdAt: p.createdAt || new Date().toISOString(),
    ownerName: p.owner?.fullName || p.ownerName,
    ownerPhone: p.owner?.phoneNumber || p.ownerPhone,
    ownerEmail: p.owner?.email || p.ownerEmail,
  };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [statuses, setStatuses] = useState<PropertyStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedStatusId, setSelectedStatusId] = useState('all');

  // Modals Visibility
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Fetch properties from API (Prisma Database)
  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties?limit=50');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          const mapped = json.data.map(mapApiPropertyToFrontend);
          setProperties(mapped);
          localStorage.setItem('arventa_properties', JSON.stringify(mapped));
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API fetch properties notice: using local storage cache', err);
    }

    // Fallback local storage only if network error occurred
    const storedProps = localStorage.getItem('arventa_properties');
    const props = storedProps ? JSON.parse(storedProps) : [];
    setProperties(props);
    setLoading(false);
  };

  useEffect(() => {
    const storedCats = localStorage.getItem('arventa_categories');
    const storedStats = localStorage.getItem('arventa_statuses');

    const cats = storedCats ? JSON.parse(storedCats) : DEFAULT_CATEGORIES;
    const stats = storedStats ? JSON.parse(storedStats) : DEFAULT_STATUSES;

    if (!storedCats) localStorage.setItem('arventa_categories', JSON.stringify(DEFAULT_CATEGORIES));
    if (!storedStats) localStorage.setItem('arventa_statuses', JSON.stringify(DEFAULT_STATUSES));

    setCategories(cats);
    setStatuses(stats);

    fetchProperties();
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
  const handleAddOrEditProperty = async (data: Omit<Property, 'id' | 'createdAt'>) => {
    const catToType: Record<string, string> = {
      'cat-1': 'KOS',
      'cat-2': 'APARTEMEN',
      'cat-3': 'KONTRAKAN',
      'cat-4': 'RUKO',
    };

    if (editingProperty) {
      // Update API in PostgreSQL
      try {
        const res = await fetch(`/api/properties/${editingProperty.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            address: data.address,
            type: catToType[data.categoryId] || 'KOS',
            description: data.description,
            coverImage: data.imageUrl,
            hasCleaningService: data.hasCleaningService,
          }),
        });

        if (res.ok) {
          await fetchProperties();
          setEditingProperty(null);
          return;
        } else {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || 'Gagal memperbarui properti di database');
        }
      } catch (err: any) {
        console.error('API update property error:', err);
        throw err;
      }
    } else {
      // Create API directly in PostgreSQL
      try {
        const res = await fetch('/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            address: data.address,
            city: 'Bandung',
            type: catToType[data.categoryId] || 'KOS',
            description: data.description,
            coverImage: data.imageUrl,
            hasCleaningService: data.hasCleaningService ?? true,
            totalUnits: data.totalUnits,
            occupiedUnits: data.occupiedUnits,
          }),
        });

        if (res.ok) {
          await fetchProperties();
          return;
        } else {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || 'Gagal menambahkan properti ke database');
        }
      } catch (err: any) {
        console.error('API create property error:', err);
        throw err;
      }
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus properti ini?')) {
      try {
        const res = await fetch(`/api/properties/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          await fetchProperties();
          return;
        }
      } catch (err) {
        console.warn('API delete property notice: deleting locally', err);
      }

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
    const newStat: PropertyStatus = {
      id: `st-${Date.now()}`,
      name,
      color,
    };
    saveStatuses([...statuses, newStat]);
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

  // Filter Logic
  const filteredProperties = properties.filter((prop) => {
    const matchesSearch =
      prop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryId === 'all' || prop.categoryId === selectedCategoryId;

    const matchesStatus =
      selectedStatusId === 'all' || prop.statusId === selectedStatusId;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Top Bar Header */}
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

        {/* Management Controls & Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCategoryOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition-all"
          >
            <Layers className="h-3.5 w-3.5 text-[#8FA28A]" />
            Kategori
          </button>
          <button
            onClick={() => setIsStatusOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition-all"
          >
            <CheckSquare className="h-3.5 w-3.5 text-[#8FA28A]" />
            Status
          </button>
          <button
            onClick={() => {
              setEditingProperty(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#8FA28A] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#7D9178] transition-all"
          >
            <Plus className="h-4 w-4" />
            Tambah Properti
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama properti atau alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-xs focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Filter Category */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedStatusId}
            onChange={(e) => setSelectedStatusId(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
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

      {/* Property Cards Grid */}
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#8FA28A] border-t-transparent mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Memuat data properti dari database...</p>
          </div>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-xs space-y-2">
          <p className="text-sm font-bold text-gray-600">Tidak ada properti ditemukan.</p>
          <p className="text-xs text-gray-400">Coba ubah kata kunci pencarian atau filter kategori/status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              category={categories.find((c) => c.id === prop.categoryId)}
              status={statuses.find((s) => s.id === prop.statusId)}
              onEdit={triggerEditProperty}
              onDelete={handleDeleteProperty}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PropertyFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProperty(null);
        }}
        onSubmit={handleAddOrEditProperty}
        initialData={editingProperty}
        categories={categories}
        statuses={statuses}
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
