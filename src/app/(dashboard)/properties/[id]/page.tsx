'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Edit3, Trash2, Home, Layers, Calendar, Info, Users, ShieldAlert, Package, Plus, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Property, PropertyCategory, PropertyStatus } from '../_types';
import PropertyFormModal from '../_components/PropertyFormModal';
import InventoryManager from '../_components/InventoryManager';
import { Unit, UnitStatus } from '../../units/_types';
import { useSafeBack } from '@/app/_hooks/useSafeBack';

const UnitFormModal = lazy(() => import('../../units/_components/UnitFormModal'));

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const handleSafeBack = useSafeBack('/properties');

  const [property, setProperty] = useState<Property | null>(null);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [statuses, setStatuses] = useState<PropertyStatus[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [unitFormDefaultMode, setUnitFormDefaultMode] = useState<'single' | 'batch'>('single');
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'units' | 'inventory'>('units');

  const loadData = () => {
    const storedProps = localStorage.getItem('arventa_properties');
    const storedCats = localStorage.getItem('arventa_categories');
    const storedStats = localStorage.getItem('arventa_statuses');
    const storedUnits = localStorage.getItem('arventa_units');

    let currentProps: Property[] = [];
    let currentCats: PropertyCategory[] = [];
    let currentStats: PropertyStatus[] = [];
    let currentUnits: Unit[] = [];

    if (storedProps) currentProps = JSON.parse(storedProps);
    if (storedCats) currentCats = JSON.parse(storedCats);
    if (storedStats) currentStats = JSON.parse(storedStats);
    if (storedUnits) currentUnits = JSON.parse(storedUnits);

    const found = currentProps.find((p) => p.id === id);
    const propUnits = currentUnits.filter((u) => u.propertyId === id);

    setCategories(currentCats);
    setStatuses(currentStats);
    if (found) {
      setProperty(found);
    }
    setUnits(propUnits);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [id]);

  const saveAllUnits = (allUnits: Unit[]) => {
    localStorage.setItem('arventa_units', JSON.stringify(allUnits));
    setUnits(allUnits.filter((u) => u.propertyId === id));
  };

  const handleAddOrEditUnit = (data: Omit<Unit, 'id' | 'createdAt'>) => {
    const storedUnits = localStorage.getItem('arventa_units');
    const allUnits: Unit[] = storedUnits ? JSON.parse(storedUnits) : [];

    if (editingUnit) {
      const updated = allUnits.map((u) => (u.id === editingUnit.id ? { ...u, ...data } : u));
      saveAllUnits(updated);
      setEditingUnit(null);
    } else {
      const newUnit: Unit = {
        ...data,
        id: `unit-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      saveAllUnits([...allUnits, newUnit]);
    }
  };

  const handleAddBatchUnits = (batchData: Omit<Unit, 'id' | 'createdAt'>[]) => {
    const storedUnits = localStorage.getItem('arventa_units');
    const allUnits: Unit[] = storedUnits ? JSON.parse(storedUnits) : [];

    const now = Date.now();
    const newUnits: Unit[] = batchData.map((data, idx) => ({
      ...data,
      id: `unit-${now}-${idx}`,
      createdAt: new Date().toISOString(),
    }));

    saveAllUnits([...allUnits, ...newUnits]);
  };

  const handleDeleteUnit = (unitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
      const storedUnits = localStorage.getItem('arventa_units');
      if (storedUnits) {
        const allUnits: Unit[] = JSON.parse(storedUnits);
        const updated = allUnits.filter((u) => u.id !== unitId);
        saveAllUnits(updated);
      }
    }
  };

  const handleQuickStatusChange = (unitId: string, newStatus: UnitStatus, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) => (u.id === unitId ? { ...u, status: newStatus } : u));
      saveAllUnits(updated);
    }
  };

  const openSingleUnitModal = () => {
    setEditingUnit(null);
    setUnitFormDefaultMode('single');
    setIsUnitFormOpen(true);
  };

  const openBatchUnitModal = () => {
    setEditingUnit(null);
    setUnitFormDefaultMode('batch');
    setIsUnitFormOpen(true);
  };

  const triggerEditUnit = (unit: Unit, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingUnit(unit);
    setUnitFormDefaultMode('single');
    setIsUnitFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-[#F7F4ED]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Memuat detail properti...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center rounded-2xl border border-[#C7D3C0]/40 bg-[#F7F4ED] p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-[#C8A96B] mb-3" />
        <h2 className="text-lg font-bold text-gray-800">Properti Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Properti yang Anda cari tidak terdaftar atau telah dihapus oleh pengguna.
        </p>
        <button
          type="button"
          onClick={handleSafeBack}
          className="mt-4 min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Properti
        </button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === property.categoryId);
  const status = statuses.find((s) => s.id === property.statusId);

  const total = units.length;
  const occupied = units.filter((u) => u.status === 'Occupied').length;
  const vacant = Math.max(0, total - occupied);
  const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  // Premium image handling with reliable Unsplash fallback based on category
  const getFallbackImage = (catName?: string) => {
    switch (catName?.toLowerCase()) {
      case 'kos':
        return 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=1200';
      case 'apartemen':
        return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200';
      case 'kontrakan':
        return 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=1200';
      case 'ruko':
        return 'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?auto=format&fit=crop&q=80&w=1200';
      default:
        return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200';
    }
  };

  const displayImage = property.imageUrl || getFallbackImage(category?.name);

  const handleEditProperty = (data: Omit<Property, 'id' | 'createdAt'>) => {
    const storedProps = localStorage.getItem('arventa_properties');
    if (storedProps) {
      const allProps: Property[] = JSON.parse(storedProps);
      const updated = allProps.map((p) =>
        p.id === property.id ? { ...p, ...data } : p
      );
      localStorage.setItem('arventa_properties', JSON.stringify(updated));
      setProperty({ ...property, ...data });
    }
  };

  const handleDeleteProperty = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus properti ini?')) {
      const storedProps = localStorage.getItem('arventa_properties');
      if (storedProps) {
        const allProps: Property[] = JSON.parse(storedProps);
        const updated = allProps.filter((p) => p.id !== property.id);
        localStorage.setItem('arventa_properties', JSON.stringify(updated));
        router.push('/properties');
      }
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[90vh] p-4 sm:p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Navigation Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#C7D3C0]/30 pb-4">
        <button
          type="button"
          onClick={handleSafeBack}
          className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#8FA28A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Listing Properti
        </button>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFormOpen(true)}
            className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-[#C7D3C0] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-[#C7D3C0]/20 transition-all shadow-sm"
          >
            <Edit3 className="h-4 w-4 text-[#8FA28A]" />
            Ubah Properti
          </button>
          <button
            onClick={handleDeleteProperty}
            className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-all shadow-sm"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
            Hapus Properti
          </button>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Image, Badges, Name, Details, and Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="overflow-hidden rounded-2xl border border-[#C7D3C0]/40 bg-white shadow-sm">
            {/* Property Hero Image */}
            <div className="relative h-72 w-full overflow-hidden bg-gray-100">
              <img
                src={displayImage}
                alt={property.name}
                loading="lazy"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getFallbackImage(category?.name);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

              {/* Floating badges on detail hero */}
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  {category && (
                    <span className="inline-block rounded-full bg-white/95 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-800 shadow-sm">
                      {category.name}
                    </span>
                  )}
                  <h2 className="text-2xl font-black text-white drop-shadow-sm">{property.name}</h2>
                </div>
                {status && (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-sm border border-white/20"
                    style={{ backgroundColor: status.color }}
                  >
                    {status.name}
                  </span>
                )}
              </div>
            </div>

            {/* Core Info */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-800">Alamat Properti:</span>
                  <p className="mt-0.5 text-gray-600">{property.address}</p>
                </div>
              </div>

              {property.description && (
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Tentang Properti</span>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section Tab Switcher */}
          <div className="flex gap-4 border-b border-[#C7D3C0]/40 pb-2">
            <button
              onClick={() => setActiveTab('units')}
              className={`flex items-center gap-1.5 pb-2 text-sm font-black border-b-2 transition-all ${
                activeTab === 'units'
                  ? 'border-[#8FA28A] text-[#8FA28A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="h-4 w-4" />
              Kamar / Unit ({units.length})
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 pb-2 text-sm font-black border-b-2 transition-all ${
                activeTab === 'inventory'
                  ? 'border-[#8FA28A] text-[#8FA28A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="h-4 w-4" />
              Inventaris Barang
            </button>
          </div>

          {/* Switchable Sections */}
          {activeTab === 'units' ? (
            <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
              {/* Unit Section Header with Creation Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                    <Home className="h-5 w-5 text-[#8FA28A]" />
                    Daftar Kamar / Unit
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Total {units.length} Unit terdaftar di properti ini</p>
                </div>

                {/* Add Unit Buttons (Single & Batch Modes) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openSingleUnitModal}
                    className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4 text-[#8FA28A]" />
                    + Tambah 1 Unit
                  </button>
                  <button
                    type="button"
                    onClick={openBatchUnitModal}
                    className="min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-3.5 py-2 text-xs font-black transition-all shadow-sm"
                  >
                    <Sparkles className="h-4 w-4" />
                    ⚡ Tambah Beberapa (Batch)
                  </button>
                </div>
              </div>

              {units.length === 0 ? (
                <div className="text-center py-10 space-y-3 border-2 border-dashed border-gray-200 rounded-2xl p-6">
                  <Home className="h-10 w-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400">Belum ada unit yang terdaftar di properti ini.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={openSingleUnitModal}
                      className="text-xs font-bold text-[#8FA28A] hover:underline"
                    >
                      + Tambah 1 Unit
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      onClick={openBatchUnitModal}
                      className="text-xs font-black text-[#8FA28A] hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" /> Tambah Beberapa Unit Sekaligus
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {units.map((unit) => {
                    const isRoomOccupied = unit.status === 'Occupied';
                    return (
                      <div
                        key={unit.id}
                        className={`group flex flex-col justify-between rounded-xl border p-4 transition-all hover:shadow-md ${
                          isRoomOccupied
                            ? 'border-blue-200 bg-blue-50/20'
                            : 'border-gray-200 bg-white hover:border-[#8FA28A]/50'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/properties/${id}/units/${unit.id}`}
                                className="text-sm font-black text-gray-800 hover:text-[#8FA28A] transition-colors"
                              >
                                {unit.name}
                              </Link>
                              <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
                                {unit.capacity.dimensions} • Max {unit.capacity.maxPersons} Orang
                              </p>
                            </div>

                            {/* Inline Quick Status Selector */}
                            <select
                              value={unit.status}
                              onChange={(e) => handleQuickStatusChange(unit.id, e.target.value as UnitStatus, e)}
                              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border focus:outline-none cursor-pointer ${
                                unit.status === 'Available'
                                  ? 'bg-[#8FA28A] text-white border-[#8FA28A]'
                                  : unit.status === 'Occupied'
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : unit.status === 'Need Cleaning'
                                  ? 'bg-[#C8A96B] text-white border-[#C8A96B]'
                                  : unit.status === 'Reserved'
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-red-600 text-white border-red-600'
                              }`}
                            >
                              <option value="Available" className="bg-white text-gray-800">Tersedia</option>
                              <option value="Occupied" className="bg-white text-gray-800">Terisi</option>
                              <option value="Need Cleaning" className="bg-white text-gray-800">Need Cleaning</option>
                              <option value="Maintenance" className="bg-white text-gray-800">Perbaikan</option>
                              <option value="Reserved" className="bg-white text-gray-800">Reserved</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100/80">
                            <span className="font-black text-[#8FA28A]">
                              {formatRupiah(unit.pricing.monthly)}
                              <span className="text-[10px] font-semibold text-gray-400">/bln</span>
                            </span>
                            {unit.tenantName && (
                              <span className="text-[11px] font-bold text-blue-600 truncate max-w-[120px]">
                                Penyewa: {unit.tenantName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inline Actions (Edit, Delete, Detail) */}
                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => triggerEditUnit(unit, e)}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              title="Edit Unit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteUnit(unit.id, e)}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title="Hapus Unit"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <Link
                            href={`/properties/${id}/units/${unit.id}`}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-[#8FA28A] hover:text-white font-bold text-xs text-gray-700 transition-colors flex items-center gap-1"
                          >
                            Detail <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in duration-200">
              <InventoryManager propertyId={property.id} propertyName={property.name} />
            </div>
          )}
        </div>

        {/* Right Column: Statistics / Metrics Overview */}
        <div className="space-y-6">
          {/* Summary/Occupancy Card */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <Info className="h-5 w-5 text-[#8FA28A]" />
              Ringkasan Keterisian
            </h3>

            {/* Circular Rate or Giant Text */}
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-4 border-gray-100">
                <div
                  className="absolute inset-0 rounded-full border-4 border-t-[#8FA28A] border-r-[#8FA28A]"
                  style={{
                    transform: `rotate(${rate * 3.6}deg)`,
                    transition: 'transform 0.8s ease-in-out',
                  }}
                />
                <span className="text-2xl font-black text-gray-800">{rate}%</span>
              </div>
              <p className="text-xs font-bold text-[#8FA28A] uppercase tracking-wide">Tingkat Keterisian</p>
            </div>

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="bg-[#F7F4ED] rounded-xl p-2.5 border border-[#C7D3C0]/20">
                <span className="block text-xs font-bold text-gray-400">Total</span>
                <span className="text-lg font-black text-gray-800">{total}</span>
              </div>
              <div className="bg-[#8FA28A]/10 rounded-xl p-2.5 border border-[#8FA28A]/20">
                <span className="block text-xs font-bold text-[#8FA28A]">Terisi</span>
                <span className="text-lg font-black text-[#8FA28A]">{occupied}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <span className="block text-xs font-bold text-gray-400">Kosong</span>
                <span className="text-lg font-black text-gray-600">{vacant}</span>
              </div>
            </div>
          </div>

          {/* Quick Info & Metadata */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detail Sistem</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  Ditambahkan pada
                </span>
                <span className="font-semibold text-gray-700">
                  {new Date(property.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-gray-400" />
                  Kategori
                </span>
                <span className="font-semibold text-gray-700">{category?.name || 'Umum'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  Role Pengelola
                </span>
                <span className="font-semibold text-[#8FA28A]">Pemilik Properti</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal for Editing Property */}
      <PropertyFormModal
        key={property.id}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleEditProperty}
        categories={categories}
        statuses={statuses}
        initialData={property}
      />

      {/* Dynamic Unit Form Modal (Single & Batch Creation / Editing) */}
      <Suspense fallback={null}>
        {isUnitFormOpen && (
          <UnitFormModal
            isOpen={isUnitFormOpen}
            onClose={() => {
              setIsUnitFormOpen(false);
              setEditingUnit(null);
            }}
            onSubmit={handleAddOrEditUnit}
            onSubmitBatch={handleAddBatchUnits}
            initialData={editingUnit}
            initialPropertyId={property.id}
            properties={[property]}
            defaultMode={unitFormDefaultMode}
          />
        )}
      </Suspense>
    </div>
  );
}
