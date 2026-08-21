'use client';

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Filter, LayoutGrid, List, AlertTriangle, ArrowLeft, Check, Layers, Trash2, Edit3, DollarSign, Tag, CheckSquare, Square } from 'lucide-react';
import { Unit, UnitStatus, BulkActionPayload, BulkActionType } from './_types';
import UnitCard from './_components/UnitCard';
import { Property } from '../properties/_types';
import { useSafeBack } from '@/app/_hooks/useSafeBack';

// Lazy loading heavy modals
const UnitFormModal = lazy(() => import('./_components/UnitFormModal'));
const BulkActionModal = lazy(() => import('./_components/BulkActionModal'));

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
  const handleSafeBack = useSafeBack('/properties');

  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state with URL params for back/forward browser support
  const searchQuery = searchParams.get('q') || '';
  const selectedPropertyId = searchParams.get('propertyId') || 'all';
  const selectedStatus = searchParams.get('status') || 'all';
  const viewMode = (searchParams.get('view') as 'grid' | 'table') || 'grid';

  // Multi-select bulk state (SCRUM-252)
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInitialTab, setBulkInitialTab] = useState<BulkActionType>('status');

  // Modal Visibility
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

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

  // Load data from localStorage
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
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
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

  // CRUD Handlers
  const handleAddOrEditUnit = async (data: Omit<Unit, 'id' | 'createdAt'>) => {
    if (editingUnit) {
      const updated = units.map((u) =>
        u.id === editingUnit.id ? { ...u, ...data } : u
      );
      saveUnits(updated);
      setEditingUnit(null);

      // Backend Prisma sync
      try {
        await fetch(`/api/units/${editingUnit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch (e) {
        console.error('Failed to update unit in database:', e);
      }
    } else {
      const newUnit: Unit = {
        ...data,
        id: `unit-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      saveUnits([...units, newUnit]);

      // Backend Prisma create
      try {
        await fetch('/api/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: data.propertyId,
            name: data.name,
            floor: 1,
            basePrice: data.pricing.monthly,
            transitPrice: data.pricing.daily,
            deposit: data.pricing.deposit,
            capacity: data.capacity.maxPersons,
            dimensions: data.capacity.dimensions,
            facilities: data.facilities,
            description: data.description,
            tenantName: data.tenantName,
            tenantPhone: data.tenantPhone,
            checkInDate: data.checkInDate,
          }),
        });
      } catch (e) {
        console.error('Failed to create unit in database:', e);
      }
    }
  };

  const handleAddBatchUnits = async (batchData: Omit<Unit, 'id' | 'createdAt'>[]) => {
    const now = Date.now();
    const newUnits: Unit[] = batchData.map((data, idx) => ({
      ...data,
      id: `unit-${now}-${idx}`,
      createdAt: new Date().toISOString(),
    }));
    saveUnits([...units, ...newUnits]);

    // Backend Prisma batch create
    try {
      if (batchData.length > 0) {
        const propertyId = batchData[0].propertyId;
        const mapped = batchData.map((d) => ({
          propertyId: d.propertyId,
          name: d.name,
          basePrice: d.pricing.monthly,
          transitPrice: d.pricing.daily,
          deposit: d.pricing.deposit,
          capacity: d.capacity.maxPersons,
          dimensions: d.capacity.dimensions,
          facilities: d.facilities,
          description: d.description,
        }));
        await fetch('/api/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batch: true, propertyId, units: mapped }),
        });
      }
    } catch (e) {
      console.error('Failed to create batch units in database:', e);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
      const updated = units.filter((u) => u.id !== id);
      saveUnits(updated);
      setSelectedUnitIds((prev) => prev.filter((item) => item !== id));

      // Backend Prisma delete
      try {
        await fetch(`/api/units/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete unit in database:', e);
      }
    }
  };

  const triggerEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsFormOpen(true);
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

  // Bulk Selection Handlers (SCRUM-252)
  const isAllSelected = useMemo(() => {
    return filteredUnits.length > 0 && filteredUnits.every((u) => selectedUnitIds.includes(u.id));
  }, [filteredUnits, selectedUnitIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUnitIds([]);
    } else {
      setSelectedUnitIds(filteredUnits.map((u) => u.id));
    }
  };

  const toggleSelectUnit = (id: string) => {
    if (selectedUnitIds.includes(id)) {
      setSelectedUnitIds(selectedUnitIds.filter((item) => item !== id));
    } else {
      setSelectedUnitIds([...selectedUnitIds, id]);
    }
  };

  const openBulkModal = (tab: BulkActionType) => {
    setBulkInitialTab(tab);
    setIsBulkModalOpen(true);
  };

  // Bulk Action Mutation Handler (SCRUM-252)
  const handleApplyBulkAction = async (payload: BulkActionPayload, customTargetIds?: string[]) => {
    let updated = [...units];
    const targetIds =
      customTargetIds && customTargetIds.length > 0
        ? customTargetIds
        : selectedUnitIds.length > 0
        ? selectedUnitIds
        : units.map((u) => u.id);

    if (payload.actionType === 'delete') {
      updated = updated.filter((u) => !targetIds.includes(u.id));
    } else if (payload.actionType === 'status' && payload.newStatus) {
      updated = updated.map((u) =>
        targetIds.includes(u.id) ? { ...u, status: payload.newStatus! } : u
      );
    } else if (payload.actionType === 'facilities' && payload.facilitiesToApply) {
      const { facilityOperation, facilitiesToApply } = payload;
      updated = updated.map((u) => {
        if (!targetIds.includes(u.id)) return u;
        let currentFacs = [...u.facilities];
        if (facilityOperation === 'add') {
          const toAdd = facilitiesToApply.filter((f) => !currentFacs.includes(f));
          currentFacs = [...currentFacs, ...toAdd];
        } else if (facilityOperation === 'remove') {
          currentFacs = currentFacs.filter((f) => !facilitiesToApply.includes(f));
        }
        return { ...u, facilities: currentFacs };
      });
    } else if (payload.actionType === 'pricing' && payload.priceAdjustmentType && payload.priceValue !== undefined) {
      const { priceAdjustmentType, priceValue } = payload;
      updated = updated.map((u) => {
        if (!targetIds.includes(u.id)) return u;
        let newMonthly = u.pricing.monthly;

        if (priceAdjustmentType === 'set') {
          newMonthly = priceValue;
        } else if (priceAdjustmentType === 'flat_increase') {
          newMonthly = Math.max(0, newMonthly + priceValue);
        } else if (priceAdjustmentType === 'flat_decrease') {
          newMonthly = Math.max(0, Math.round(newMonthly - priceValue));
        } else if (priceAdjustmentType === 'percent_increase') {
          newMonthly = Math.max(0, Math.round(newMonthly * (1 + priceValue / 100)));
        } else if (priceAdjustmentType === 'percent_decrease') {
          newMonthly = Math.max(0, Math.round(newMonthly * (1 - priceValue / 100)));
        }

        return {
          ...u,
          pricing: {
            ...u.pricing,
            monthly: newMonthly,
          },
        };
      });
    }

    saveUnits(updated);
    setSelectedUnitIds([]);

    // Backend Prisma Bulk API call
    try {
      await fetch('/api/units/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitIds: targetIds,
          actionType: payload.actionType,
          newStatus: payload.newStatus === 'Need Cleaning' ? 'CLEANING' : payload.newStatus?.toUpperCase(),
          facilityOperation: payload.facilityOperation,
          facilitiesToApply: payload.facilitiesToApply,
          priceAdjustmentType: payload.priceAdjustmentType,
          priceValue: payload.priceValue,
        }),
      });
    } catch (e) {
      console.error('Failed to apply bulk action in database:', e);
    }
  };

  const selectedUnitsObjects = useMemo(() => {
    return units.filter((u) => selectedUnitIds.includes(u.id));
  }, [units, selectedUnitIds]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 bg-background text-foreground dark:bg-background dark:text-foreground min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-border dark:border-border relative pb-28">
      {/* Back Button Navigation */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleSafeBack}
          className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Properti
        </button>
      </div>

      {/* Top Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground dark:text-foreground flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-[#8FA28A]" />
            Manajemen Unit Kamar
          </h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            Pantau ketersediaan, kelola harga sewa bulanan/harian, fasilitas, dan detail penyewa unit properti Anda.
          </p>
        </div>

        {/* Action Buttons */}
        <div>
          {properties.length === 0 ? (
            <Link
              href="/properties"
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#C8A96B] hover:bg-[#C8A96B]/90 text-white px-4 py-2.5 text-xs font-black transition-all shadow-sm"
            >
              <AlertTriangle className="h-4 w-4" />
              Buat Properti Terlebih Dahulu
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingUnit(null);
                  setIsFormOpen(true);
                }}
                className="min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2.5 text-xs font-black transition-all shadow-sm hover:shadow"
              >
                <Plus className="h-4 w-4" />
                Tambah Unit
              </button>

              <button
                onClick={() => {
                  if (selectedUnitIds.length === 0 && filteredUnits.length > 0) {
                    setSelectedUnitIds(filteredUnits.map((u) => u.id));
                  }
                  setIsBulkModalOpen(true);
                }}
                className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-border bg-card dark:bg-card text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted/80 px-4 py-2.5 text-xs font-bold transition-all shadow-sm"
              >
                <Edit3 className="h-4 w-4 text-[#8FA28A]" />
                Edit Unit {selectedUnitIds.length > 0 ? `(${selectedUnitIds.length})` : ''}
              </button>
            </div>
          )}
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
          {/* Select All Toggle */}
          {filteredUnits.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-border dark:border-border bg-muted/50 dark:bg-muted/40 hover:bg-muted text-xs font-bold text-foreground dark:text-foreground flex items-center gap-1.5 transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 text-[#8FA28A]" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{isAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
            </button>
          )}

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
              className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-card text-[#8FA28A] shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Tampilan Grid / Card"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => updateUrlParam('view', 'table')}
              className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
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
            Sistem mendeteksi Anda belum memiliki Properti. Anda wajib mendaftarkan properti utama Anda terlebih dahulu sebelum bisa menambahkan unit kamar.
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
            Tidak ada unit kamar ditemukan. Silakan tambahkan unit baru atau sesuaikan filter Anda.
          </p>
          <button
            onClick={() => {
              router.replace('/units');
            }}
            className="mt-3 min-h-[44px] px-3 py-1.5 text-xs font-bold text-[#8FA28A] hover:underline"
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
              onEdit={triggerEditUnit}
              onDelete={handleDeleteUnit}
              isSelected={selectedUnitIds.includes(unit.id)}
              onToggleSelect={toggleSelectUnit}
            />
          ))}
        </div>
      ) : (
        /* TABLE VIEW (Adaptive Desktop & Responsive Table) */
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-[#8FA28A] focus:ring-[#8FA28A]"
                  />
                </th>
                <th className="p-4">Nama Unit</th>
                <th className="p-4">Properti</th>
                <th className="p-4">Status</th>
                <th className="p-4">Harga / Bln</th>
                <th className="p-4">Kapasitas</th>
                <th className="p-4">Penyewa</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
              {filteredUnits.map((unit) => {
                const propName = properties.find((p) => p.id === unit.propertyId)?.name || 'Properti';
                const isSelected = selectedUnitIds.includes(unit.id);
                return (
                  <tr
                    key={unit.id}
                    className={`hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-[#8FA28A]/5' : ''}`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectUnit(unit.id)}
                        className="h-4 w-4 rounded border-gray-300 text-[#8FA28A] focus:ring-[#8FA28A]"
                      />
                    </td>
                    <td className="p-4 font-black text-gray-800">{unit.name}</td>
                    <td className="p-4 text-gray-500">{propName}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border bg-gray-50 text-gray-600 border-gray-200">
                        {unit.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-800">{formatRupiah(unit.pricing.monthly)}</td>
                    <td className="p-4 text-gray-500">{unit.capacity.maxPersons} Orang ({unit.capacity.dimensions})</td>
                    <td className="p-4">
                      {unit.tenantName ? (
                        <span className="text-blue-600 font-bold">{unit.tenantName}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => triggerEditUnit(unit)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/units/${unit.id}`}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-[#8FA28A] hover:text-white font-bold text-gray-600 transition-colors"
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

      {/* FLOATING ACTION BAR / BOTTOM SHEET (SCRUM-252 BULK ACTIONS) */}
      {selectedUnitIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 z-50 bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-800 animate-in slide-in-from-bottom-5 duration-200 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-xl bg-[#8FA28A] text-white flex items-center justify-center font-black text-xs shadow-sm">
              {selectedUnitIds.length}
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-200">
                {selectedUnitIds.length} Unit Terpilih
              </h4>
              <p className="text-[11px] text-gray-400">Pilih opsi aksi massal di bawah ini</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => openBulkModal('status')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-colors"
            >
              <Check className="h-3.5 w-3.5 text-[#8FA28A]" />
              Status
            </button>
            <button
              type="button"
              onClick={() => openBulkModal('facilities')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-colors"
            >
              <Tag className="h-3.5 w-3.5 text-[#8FA28A]" />
              Fasilitas
            </button>
            <button
              type="button"
              onClick={() => openBulkModal('pricing')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-colors"
            >
              <DollarSign className="h-3.5 w-3.5 text-[#8FA28A]" />
              Harga
            </button>
            <button
              type="button"
              onClick={() => openBulkModal('delete')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-red-500/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </button>
            <button
              type="button"
              onClick={() => setSelectedUnitIds([])}
              className="min-h-[44px] px-3 py-2 text-xs text-gray-400 hover:text-white underline"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* LAZY LOADED ADD / EDIT FORM MODAL */}
      <Suspense fallback={null}>
        {properties.length > 0 && isFormOpen && (
          <UnitFormModal
            key={editingUnit ? editingUnit.id : 'new-unit'}
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setEditingUnit(null);
            }}
            onSubmit={handleAddOrEditUnit}
            onSubmitBatch={handleAddBatchUnits}
            initialData={editingUnit}
            properties={properties}
          />
        )}
      </Suspense>

      {/* LAZY LOADED BULK ACTION MODAL */}
      <Suspense fallback={null}>
        {isBulkModalOpen && (
          <BulkActionModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
            allUnits={units}
            selectedUnits={selectedUnitsObjects}
            onApplyBulkAction={handleApplyBulkAction}
            initialAction={bulkInitialTab}
          />
        )}
      </Suspense>
    </div>
  );
}

export default function UnitsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-semibold text-gray-500">
          Memuat manajemen unit kamar...
        </div>
      }
    >
      <UnitsPageContent />
    </Suspense>
  );
}
