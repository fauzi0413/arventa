'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, LayoutGrid, List, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Unit, UnitStatus } from './_types';
import UnitCard from './_components/UnitCard';
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

function UnitsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state with URL params for back/forward browser support
  const searchQuery = searchParams.get('q') || '';
  const selectedPropertyId = searchParams.get('propertyId') || 'all';
  const selectedStatus = searchParams.get('status') || 'all';
  const viewMode = (searchParams.get('view') as 'grid' | 'table') || 'grid';

  // Custom Delete Unit Confirmation State
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);

  // Helper to update URL params
  const updateUrlParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all' && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/units?${params.toString()}`);
  };

  const fetchUnitsAndProperties = async () => {
    try {
      const [propRes, unitRes] = await Promise.all([
        fetch('/api/properties?limit=50'),
        fetch('/api/units'),
      ]);

      let mappedProps: Property[] = [];
      let mappedUnits: Unit[] = [];

      if (propRes.ok) {
        const json = await propRes.json();
        if (Array.isArray(json.data)) {
          const typeToCat: Record<string, string> = {
            KOS: 'cat-1',
            APARTEMEN: 'cat-2',
            KONTRAKAN: 'cat-3',
            RUKO: 'cat-4',
          };
          mappedProps = json.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            address: p.address,
            categoryId: typeToCat[p.type] || 'cat-1',
            statusId: 'st-1',
            totalUnits: p.units?.length || 0,
            occupiedUnits: p.units?.filter((u: any) => u.status === 'OCCUPIED' || (u.leases && u.leases.length > 0)).length || 0,
            description: p.description || '',
            imageUrl: p.coverImage || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5',
            hasCleaningService: p.hasCleaningService ?? true,
            createdAt: p.createdAt || new Date().toISOString(),
          }));
        }
      }

      if (unitRes.ok) {
        const json = await unitRes.json();
        if (Array.isArray(json.data)) {
          mappedUnits = json.data;
        }
      }

      if (mappedProps.length > 0 || mappedUnits.length > 0) {
        setProperties(mappedProps);
        setUnits(mappedUnits);
        localStorage.setItem('arventa_properties', JSON.stringify(mappedProps));
        localStorage.setItem('arventa_units', JSON.stringify(mappedUnits));
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Notice: fallback to local storage for units', err);
    }

    const storedProps = localStorage.getItem('arventa_properties');
    const storedUnits = localStorage.getItem('arventa_units');
    let loadedProps: Property[] = storedProps ? JSON.parse(storedProps) : [];
    let currentUnits: Unit[] = [];
    if (storedUnits) {
      try {
        const parsed: Unit[] = JSON.parse(storedUnits);
        currentUnits = parsed.map((u) => ({
          ...u,
          tenantName: u.status === 'Occupied' ? u.tenantName : undefined,
          tenantPhone: u.status === 'Occupied' ? u.tenantPhone : undefined,
        }));
      } catch (e) {}
    }
    let loadedUnits: Unit[] = currentUnits;
    setProperties(loadedProps);
    setUnits(loadedUnits);
    setLoading(false);
  };

  useEffect(() => {
    fetchUnitsAndProperties();
  }, []);

  const saveUnits = (updated: Unit[]) => {
    setUnits(updated);
    localStorage.setItem('arventa_units', JSON.stringify(updated));
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = units.length;
    const occupied = units.filter((u) => u.status === 'Occupied').length;
    const available = units.filter((u) => u.status === 'Available').length;
    const maintenance = units.filter((u) => u.status === 'Maintenance').length;
    const cleaning = units.filter((u) => u.status === 'Need Cleaning').length;
    const reserved = units.filter((u) => u.status === 'Reserved').length;
    return { total, occupied, available, maintenance, cleaning, reserved };
  }, [units]);

  const handleDeleteUnit = (id: string) => {
    const found = units.find((u) => u.id === id);
    if (found) {
      setUnitToDelete(found);
    }
  };

  const confirmDeleteUnit = async () => {
    if (!unitToDelete || isDeletingUnit) return;
    setIsDeletingUnit(true);
    const id = unitToDelete.id;

    const updated = units.filter((u) => u.id !== id);
    saveUnits(updated);

    // Backend Prisma delete
    try {
      await fetch(`/api/units/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to delete unit in database:', e);
    } finally {
      setIsDeletingUnit(false);
      setUnitToDelete(null);
    }
  };

  // Filter Logic
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProperty = selectedPropertyId === 'all' || u.propertyId === selectedPropertyId;
      const matchesStatus = selectedStatus === 'all' || u.status === selectedStatus;
      return matchesSearch && matchesProperty && matchesStatus;
    });
  }, [units, searchQuery, selectedPropertyId, selectedStatus]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 bg-background text-foreground dark:bg-background dark:text-foreground min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-border dark:border-border relative pb-28">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground dark:text-foreground flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-[#8FA28A]" />
            Manajemen Unit
          </h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            Pantau ketersediaan, kelola harga sewa bulanan/harian, fasilitas, dan detail penyewa unit properti Anda.
          </p>
        </div>
      </div>

      {/* Unit Statistics Section */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card dark:bg-card rounded-2xl p-4 border border-border dark:border-border h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card dark:bg-card rounded-2xl p-4 border border-border dark:border-border shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Unit</span>
              <span className="text-xl font-black text-foreground dark:text-foreground">{stats.total}</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs font-black">∑</div>
          </div>
          <div className="bg-card dark:bg-card rounded-2xl p-4 border border-border dark:border-border shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Terisi</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{stats.occupied}</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 text-xs font-black">✓</div>
          </div>
          <div className="bg-card dark:bg-card rounded-2xl p-4 border border-border dark:border-border shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Kosong (Tersedia)</span>
              <span className="text-xl font-black text-[#8FA28A]">{stats.available}</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-[#8FA28A]/10 flex items-center justify-center text-[#8FA28A] text-xs font-black">⚡</div>
          </div>
          <div className="bg-card dark:bg-card rounded-2xl p-4 border border-border dark:border-border shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Perbaikan / Reserved</span>
              <span className="text-xl font-black text-[#C8A96B]">{stats.cleaning + stats.maintenance + stats.reserved}</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-[#C8A96B] text-xs font-black">🛠</div>
          </div>
        </div>
      )}

      {/* Filter, Search & View Controls Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-4 shadow-sm md:flex-row md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama atau nomor kamar..."
            value={searchQuery}
            onChange={(e) => updateUrlParam('q', e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-border dark:border-border bg-background dark:bg-background text-foreground dark:text-foreground pl-10 pr-4 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none transition-all"
          />
        </div>

        {/* Dropdown Filters & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Property Dropdown Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedPropertyId}
              onChange={(e) => updateUrlParam('propertyId', e.target.value)}
              className="min-h-[44px] rounded-xl border border-border dark:border-border bg-background dark:bg-background text-foreground dark:text-foreground px-3 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none"
            >
              <option value="all">Semua Properti</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => updateUrlParam('status', e.target.value)}
            className="min-h-[44px] rounded-xl border border-border dark:border-border bg-background dark:bg-background text-foreground dark:text-foreground px-3 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="Available">Tersedia (Available)</option>
            <option value="Occupied">Terisi (Occupied)</option>
            <option value="Need Cleaning">Perlu Dibersihkan</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Reserved">Reserved</option>
          </select>

          {/* Grid vs Table View Switcher */}
          <div className="flex items-center bg-muted dark:bg-muted/60 p-1 rounded-xl border border-border dark:border-border">
            <button
              type="button"
              onClick={() => updateUrlParam('view', 'grid')}
              className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-card text-[#8FA28A] shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Tampilan Grid / Card"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => updateUrlParam('view', 'table')}
              className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-card text-[#8FA28A] shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Tampilan Tabel Data"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Units View (Grid / Table) */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-gray-200 rounded-lg" />
                  <div className="h-3 w-32 bg-gray-200 rounded-lg" />
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </div>
              <div className="space-y-1 pt-2">
                <div className="h-3 w-20 bg-gray-200 rounded-lg" />
                <div className="h-4 w-28 bg-gray-200 rounded-lg" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-12 bg-gray-200 rounded-lg" />
                <div className="h-6 w-16 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            Sistem mendeteksi Anda belum memiliki Properti. Anda wajib mendaftarkan properti utama Anda terlebih dahulu sebelum bisa menambahkan unit.
          </p>
          <Link
            href="/properties"
            className="mt-4 min-h-[44px] inline-flex items-center gap-1 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
          >
            Mulai Tambah Properti
          </Link>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-400">
            Tidak ada unit ditemukan. Silakan tambahkan unit baru atau sesuaikan filter Anda.
          </p>
          <button
            onClick={() => {
              router.replace('/units');
            }}
            className="mt-3 min-h-[44px] px-3 py-1.5 text-xs font-bold text-[#8FA28A] hover:underline cursor-pointer"
          >
            Reset filter
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUnits.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              propertyName={properties.find((p) => p.id === unit.propertyId)?.name || 'Properti Lain'}
              onDelete={handleDeleteUnit}
            />
          ))}
        </div>
      ) : (
        /* TABLE VIEW (Adaptive Desktop & Responsive Table) */
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
              <tr>
                <th className="p-4">Nama Unit</th>
                <th className="p-4">Properti</th>
                <th className="p-4">Status</th>
                <th className="p-4">Harga / Bln</th>
                <th className="p-4">Kapasitas</th>
                <th className="p-4">Penyewa</th>
                <th className="p-4 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
              {filteredUnits.map((unit) => {
                const propName = properties.find((p) => p.id === unit.propertyId)?.name || 'Properti';
                const detailUrl = unit.propertyId
                  ? `/properties/${unit.propertyId}/units/${unit.id}`
                  : `/units/${unit.id}`;

                return (
                  <tr
                    key={unit.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="p-4 font-black text-gray-800">{unit.name}</td>
                    <td className="p-4 text-gray-500">{propName}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border bg-gray-50 text-gray-600 border-gray-200">
                        {unit.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-800">{formatRupiah(unit.pricing.monthly)}</td>
                    <td className="p-4 text-gray-500">{typeof unit.capacity === 'object' && unit.capacity !== null ? (typeof unit.capacity.maxPersons === 'object' ? 1 : unit.capacity.maxPersons || 1) : (unit.capacity || 1)} Orang ({typeof unit.capacity === 'object' && unit.capacity !== null ? (unit.capacity.dimensions || '3x4 m') : '3x4 m'})</td>
                    <td className="p-4">
                      {unit.status === 'Occupied' && unit.tenantName ? (
                        <span className="text-blue-600 font-bold">{unit.tenantName}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-4 text-left">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          disabled={unit.status === 'Occupied'}
                          onClick={() => unit.status !== 'Occupied' && handleDeleteUnit(unit.id)}
                          className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors ${
                            unit.status === 'Occupied'
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:bg-red-50 hover:text-red-600 cursor-pointer'
                          }`}
                          title={unit.status === 'Occupied' ? 'Unit sedang terisi oleh penyewa, tidak dapat dihapus' : 'Hapus Unit'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Link
                          href={detailUrl}
                          className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#8FA28A]/10 hover:bg-[#8FA28A] text-[#8FA28A] hover:text-white font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}



      {/* Custom Delete Unit Confirmation Modal */}
      {unitToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">Hapus Unit?</h4>
                <p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border p-3.5 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Nama Unit:</span>
                <span className="font-bold text-foreground">{unitToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Status:</span>
                <span className="font-bold text-foreground">{unitToDelete.status}</span>
              </div>
              {unitToDelete.status === 'Occupied' && unitToDelete.tenantName && (
                <div className="flex justify-between items-center pt-2 border-t border-border text-amber-600 dark:text-amber-400 font-semibold">
                  <span>Penyewa Aktif:</span>
                  <span>{unitToDelete.tenantName}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Unit <strong className="text-foreground">{unitToDelete.name}</strong> beserta riwayat inventaris di dalamnya akan dihapus.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                disabled={isDeletingUnit}
                onClick={() => setUnitToDelete(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingUnit}
                onClick={confirmDeleteUnit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer min-w-[120px] justify-center"
              >
                {isDeletingUnit ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Unit</span>
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

export default function UnitsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-semibold text-gray-500">
          Memuat manajemen unit...
        </div>
      }
    >
      <UnitsPageContent />
    </Suspense>
  );
}
