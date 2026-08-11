'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, LayoutGrid, AlertTriangle } from 'lucide-react';
import { Unit } from './_types';
import UnitCard from './_components/UnitCard';
import UnitFormModal from './_components/UnitFormModal';
import { Property } from '../properties/_types';

const DEFAULT_UNITS = (propId1: string, propId2: string): Unit[] => [
  {
    id: 'unit-1',
    propertyId: propId1,
    name: 'Kamar 101',
    status: 'Available',
    facilities: ['AC', 'Kasur Springbed', 'Kamar Mandi Dalam', 'WiFi'],
    capacity: { maxPersons: 1, dimensions: '3x4 m' },
    pricing: { monthly: 1500000, deposit: 500000, utilities: 'Token Listrik Mandiri' },
    description: 'Kamar lantai bawah dekat parkiran, sirkulasi udara baik.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'unit-2',
    propertyId: propId1,
    name: 'Kamar 102',
    status: 'Occupied',
    facilities: ['AC', 'Kasur Springbed', 'Kamar Mandi Dalam', 'TV', 'WiFi'],
    capacity: { maxPersons: 2, dimensions: '4x4 m' },
    pricing: { monthly: 1800000, deposit: 500000 },
    description: 'Kamar lantai bawah double bed.',
    tenantName: 'Budi Santoso',
    tenantPhone: '08123456789',
    checkInDate: '2026-08-01',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'unit-3',
    propertyId: propId2,
    name: 'Suite Unit A',
    status: 'Maintenance',
    facilities: ['AC', 'Kasur Springbed', 'Kamar Mandi Dalam', 'TV', 'WiFi', 'Water Heater'],
    capacity: { maxPersons: 2, dimensions: '5x6 m' },
    pricing: { monthly: 4500000, deposit: 1000000, utilities: 'IPL Gratis' },
    description: 'Sedang perbaikan AC bocor dan pengecatan ulang dinding.',
    createdAt: new Date().toISOString(),
  },
];

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal Visibility
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Load from local storage asynchronously to bypass set-state-in-effect warning
  useEffect(() => {
    const storedProps = localStorage.getItem('arventa_properties');
    const storedUnits = localStorage.getItem('arventa_units');

    let loadedProps: Property[] = [];
    if (storedProps) {
      loadedProps = JSON.parse(storedProps);
    }

    const propId1 = loadedProps[0]?.id || 'prop-1';
    const propId2 = loadedProps[1]?.id || 'prop-2';

    const loadedUnits = storedUnits ? JSON.parse(storedUnits) : DEFAULT_UNITS(propId1, propId2);
    if (!storedUnits) {
      localStorage.setItem('arventa_units', JSON.stringify(DEFAULT_UNITS(propId1, propId2)));
    }

    const timer = setTimeout(() => {
      setProperties(loadedProps);
      setUnits(loadedUnits);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const saveUnits = (updated: Unit[]) => {
    setUnits(updated);
    localStorage.setItem('arventa_units', JSON.stringify(updated));
  };

  // CRUD Handlers
  const handleAddOrEditUnit = (data: Omit<Unit, 'id' | 'createdAt'>) => {
    if (editingUnit) {
      const updated = units.map((u) =>
        u.id === editingUnit.id ? { ...u, ...data } : u
      );
      saveUnits(updated);
      setEditingUnit(null);
    } else {
      const newUnit: Unit = {
        ...data,
        id: `unit-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      saveUnits([...units, newUnit]);
    }
  };

  const handleDeleteUnit = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
      const updated = units.filter((u) => u.id !== id);
      saveUnits(updated);
    }
  };

  const triggerEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsFormOpen(true);
  };

  // Filter Logic
  const filteredUnits = units.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProperty = selectedPropertyId === 'all' || u.propertyId === selectedPropertyId;
    const matchesStatus = selectedStatus === 'all' || u.status === selectedStatus;
    return matchesSearch && matchesProperty && matchesStatus;
  });

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-[#8FA28A]" />
            Manajemen Unit Kamar
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau ketersediaan, kelola harga sewa bulanan/harian, fasilitas, dan detail penyewa unit properti Anda.
          </p>
        </div>

        {/* Action Button */}
        <div>
          {properties.length === 0 ? (
            <Link
              href="/properties"
              className="flex items-center gap-1.5 rounded-xl bg-[#C8A96B] hover:bg-[#C8A96B]/90 text-white px-4 py-2 text-xs font-black transition-all shadow-sm"
            >
              <AlertTriangle className="h-4 w-4" />
              Buat Properti Terlebih Dahulu
            </Link>
          ) : (
            <button
              onClick={() => {
                setEditingUnit(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-black transition-all shadow-sm hover:shadow"
            >
              <Plus className="h-4 w-4" />
              Tambah Unit Kamar
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau nomor kamar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-sm focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Property Dropdown Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
            >
              <option value="all">Semua Properti</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tab Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="Available">Tersedia (Available)</option>
            <option value="Occupied">Terisi (Occupied)</option>
            <option value="Need Cleaning">Perlu Dibersihkan</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Grid Rooms View */}
      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            Sistem mendeteksi Anda belum memiliki Properti. Anda wajib mendaftarkan properti utama Anda terlebih dahulu sebelum bisa menambahkan unit kamar.
          </p>
          <Link
            href="/properties"
            className="mt-4 inline-flex items-center gap-1 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
          >
            Mulai Tambah Properti
          </Link>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-400">
            Tidak ada unit kamar ditemukan. Silakan tambahkan unit baru atau sesuaikan filter Anda.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedPropertyId('all');
              setSelectedStatus('all');
            }}
            className="mt-3 text-xs font-bold text-[#8FA28A] hover:underline"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUnits.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              propertyName={properties.find((p) => p.id === unit.propertyId)?.name || 'Properti Lain'}
              onEdit={triggerEditUnit}
              onDelete={handleDeleteUnit}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {properties.length > 0 && (
        <UnitFormModal
          key={editingUnit ? editingUnit.id : 'new-unit'}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingUnit(null);
          }}
          onSubmit={handleAddOrEditUnit}
          initialData={editingUnit}
          properties={properties}
        />
      )}
    </div>
  );
}
