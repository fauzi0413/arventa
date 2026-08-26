'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Edit3, Trash2, Home, Layers, Calendar, Info, Users, ShieldAlert, Package, Plus, Sparkles, ArrowRight, Check, FileText, Settings } from 'lucide-react';
import { Property, PropertyCategory, PropertyStatus } from '../_types';
import PropertyFormModal from '../_components/PropertyFormModal';
import PropertyContractTemplateModal from '../_components/PropertyContractTemplateModal';
import InventoryManager from '../_components/InventoryManager';
import { Unit, UnitStatus } from '../../units/_types';
import UnitStatusBadgeDropdown from '../../units/_components/UnitStatusBadgeDropdown';
import { useSafeBack } from '@/app/_hooks/useSafeBack';

const UnitFormModal = lazy(() => import('../../units/_components/UnitFormModal'));
const BulkActionModal = lazy(() => import('../../units/_components/BulkActionModal'));

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

  // Contract template state
  const [contractTemplate, setContractTemplate] = useState<{
    id?: string | null;
    templateName?: string;
    customClauses?: string[];
    rules?: string;
    notes?: string;
  } | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const fetchContractTemplate = async () => {
    try {
      const res = await fetch(`/api/properties/${id}/contract-template`);
      if (res.ok) {
        const json = await res.json();
        setContractTemplate(json.data);
      }
    } catch (e) {
      console.warn('Failed to fetch property contract template');
    }
  };

  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [unitFormDefaultMode, setUnitFormDefaultMode] = useState<'single' | 'batch'>('single');
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Bulk edit state
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'units' | 'inventory'>('units');

  const loadData = async () => {
    try {
      const res = await fetch(`/api/properties/${id}`);
      if (res.ok) {
        const json = await res.json();
        const p = json.data;
        if (p) {
          const typeToCat: Record<string, string> = {
            KOS: 'cat-1',
            APARTEMEN: 'cat-2',
            KONTRAKAN: 'cat-3',
            RUKO: 'cat-4',
          };
          const mappedProp: Property = {
            id: p.id,
            name: p.name,
            address: `${p.address}${p.city ? `, ${p.city}` : ''}`,
            categoryId: typeToCat[p.type] || 'cat-1',
            statusId: 'st-1',
            totalUnits: p.units?.length || 0,
            occupiedUnits: p.units?.filter((u: any) => u.status === 'OCCUPIED').length || 0,
            description: p.description || '',
            imageUrl: p.coverImage || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600',
            hasCleaningService: p.hasCleaningService ?? true,
            createdAt: p.createdAt || new Date().toISOString(),
            ownerName: p.owner?.fullName || p.ownerName,
            ownerPhone: p.owner?.phoneNumber || p.ownerPhone,
            ownerEmail: p.owner?.email || p.ownerEmail,
          };

          const statusMap: Record<string, UnitStatus> = {
            AVAILABLE: 'Available',
            OCCUPIED: 'Occupied',
            MAINTENANCE: 'Maintenance',
            CLEANING: 'Need Cleaning',
            NEED_CLEANING: 'Need Cleaning',
            RESERVED: 'Reserved',
          };

          const mappedUnits: Unit[] = (p.units || []).map((u: any) => {
            const activeLease = u.leases?.[0];
            const tenant = activeLease?.tenant;
            return {
              id: u.id,
              propertyId: p.id,
              name: u.unitNumber,
              status: statusMap[u.status] || 'Available',
              facilities: Array.isArray(u.facilities) ? u.facilities : ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Kasur Springbed'],
              capacity: {
                maxPersons: u.capacity || 1,
                dimensions: u.dimensions || (u.floor ? `Lantai ${u.floor}` : '3x4 m'),
              },
              pricing: {
                monthly: Number(u.basePrice) || 0,
                daily: u.transitPrice ? Number(u.transitPrice) : (u.dailyPrice ? Number(u.dailyPrice) : undefined),
                deposit: u.deposit !== undefined && u.deposit !== null ? Number(u.deposit) : 0,
                utilities: u.utilities || '',
              },
              description: u.description || (u.floor ? `Lantai ${u.floor}` : ''),
              tenantName: tenant?.fullName || tenant?.user?.fullName || u.tenantName || '',
              tenantPhone: tenant?.phoneNumber || tenant?.user?.phoneNumber || u.tenantPhone || '',
              checkInDate: activeLease?.startDate ? (typeof activeLease.startDate === 'string' ? activeLease.startDate.split('T')[0] : new Date(activeLease.startDate).toISOString().split('T')[0]) : (u.checkInDate || ''),
              createdAt: u.createdAt || new Date().toISOString(),
            };
          });

          setProperty(mappedProp);
          setUnits(mappedUnits);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API fetch property detail notice: using local storage cache', err);
    }

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
      setProperty({
        ...found,
        ownerName: found.ownerName || 'Bpk. Hendra Pratama',
        ownerPhone: found.ownerPhone || '081222222222',
        ownerEmail: found.ownerEmail || 'owner@arventa.id',
      });
    }
    setUnits(propUnits);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    fetchContractTemplate();
  }, [id]);

  const saveAllUnits = (allUnits: Unit[]) => {
    localStorage.setItem('arventa_units', JSON.stringify(allUnits));
    setUnits(allUnits.filter((u) => u.propertyId === id));
  };

  const handleAddOrEditUnit = async (data: Omit<Unit, 'id' | 'createdAt'>) => {
    const storedUnits = localStorage.getItem('arventa_units');
    const allUnits: Unit[] = storedUnits ? JSON.parse(storedUnits) : [];

    if (editingUnit) {
      const updated = allUnits.map((u) => (u.id === editingUnit.id ? { ...u, ...data } : u));
      saveAllUnits(updated);

      try {
        await fetch(`/api/units/${editingUnit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch (e) {
        console.error('Failed to update unit in database:', e);
      }
      setEditingUnit(null);
      await loadData();
    } else {
      const newUnit: Unit = {
        ...data,
        id: `unit-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      saveAllUnits([...allUnits, newUnit]);

      // Backend Prisma DB create
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
      await loadData();
    }
  };

  const handleAddBatchUnits = async (batchData: Omit<Unit, 'id' | 'createdAt'>[]) => {
    const storedUnits = localStorage.getItem('arventa_units');
    const allUnits: Unit[] = storedUnits ? JSON.parse(storedUnits) : [];

    const now = Date.now();
    const newUnits: Unit[] = batchData.map((data, idx) => ({
      ...data,
      id: `unit-${now}-${idx}`,
      createdAt: new Date().toISOString(),
    }));

    saveAllUnits([...allUnits, ...newUnits]);

    // Backend Prisma DB batch create
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
      console.error('Failed to batch create units in database:', e);
    }
  };

  const handleApplyBulkAction = async (payload: any, customTargetIds?: string[]) => {
    const storedUnits = localStorage.getItem('arventa_units');
    const allUnits: Unit[] = storedUnits ? JSON.parse(storedUnits) : [];
    let updated = [...allUnits];

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
          const toAdd = facilitiesToApply.filter((f: string) => !currentFacs.includes(f));
          currentFacs = [...currentFacs, ...toAdd];
        } else if (facilityOperation === 'remove') {
          currentFacs = currentFacs.filter((f: string) => !facilitiesToApply.includes(f));
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
          newMonthly = Math.max(0, newMonthly - priceValue);
        } else if (priceAdjustmentType === 'percent_increase') {
          newMonthly = Math.max(0, Math.round(newMonthly * (1 + priceValue / 100)));
        } else if (priceAdjustmentType === 'percent_decrease') {
          newMonthly = Math.max(0, Math.round(newMonthly * (1 - priceValue / 100)));
        }

        return { ...u, pricing: { ...u.pricing, monthly: newMonthly } };
      });
    }

    saveAllUnits(updated);
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

  const handleDeleteUnit = async (unitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
      const storedUnits = localStorage.getItem('arventa_units');
      if (storedUnits) {
        const allUnits: Unit[] = JSON.parse(storedUnits);
        const updated = allUnits.filter((u) => u.id !== unitId);
        saveAllUnits(updated);
      }

      // Backend Prisma DB delete
      try {
        await fetch(`/api/units/${unitId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete unit in database:', err);
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

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#F7F4ED] rounded-2xl border border-[#C7D3C0]/40 p-6">
        <div className="text-center space-y-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-xs text-gray-600 font-bold tracking-wide">Memuat rincian properti & unit dari database...</p>
        </div>
      </div>
    );
  }

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
              className={`flex items-center gap-1.5 pb-2 text-sm font-black border-b-2 transition-all ${activeTab === 'units'
                ? 'border-[#8FA28A] text-[#8FA28A]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Home className="h-4 w-4" />
              Kamar / Unit ({units.length})
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 pb-2 text-sm font-black border-b-2 transition-all ${activeTab === 'inventory'
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

                {/* Action Buttons: 1. + Tambah Unit (Single entry for single/batch modal), 2. Edit Unit (Bulk/Multi edit modal) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUnit(null);
                      setIsUnitFormOpen(true);
                    }}
                    className="min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-black transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Unit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedUnitIds.length === 0 && units.length > 0) {
                        setSelectedUnitIds(units.map((u) => u.id));
                      }
                      setIsBulkModalOpen(true);
                    }}
                    className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 dark:bg-card dark:text-card-foreground dark:border-border px-3.5 py-2 text-xs font-bold transition-all shadow-sm"
                  >
                    <Edit3 className="h-4 w-4 text-[#8FA28A]" />
                    Edit Unit
                  </button>
                </div>
              </div>

              {units.length === 0 ? (
                <div className="text-center py-10 space-y-3 border-2 border-dashed border-gray-200 rounded-2xl p-6">
                  <Home className="h-10 w-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400">Belum ada unit yang terdaftar di properti ini.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setEditingUnit(null);
                        setIsUnitFormOpen(true);
                      }}
                      className="text-xs font-bold text-[#8FA28A] hover:underline"
                    >
                      Tambah Unit Kamar
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
                        className={`group flex flex-col justify-between rounded-xl border p-4 transition-all hover:shadow-md ${isRoomOccupied
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

                            {/* Inline Custom Status Badge Dropdown */}
                            <UnitStatusBadgeDropdown
                              status={unit.status}
                              onChange={async (newStatus) => {
                                const updatedUnits = units.map((u) => (u.id === unit.id ? { ...u, status: newStatus } : u));
                                setUnits(updatedUnits);

                                const statusMap: Record<string, string> = {
                                  Available: 'AVAILABLE',
                                  Occupied: 'OCCUPIED',
                                  'Need Cleaning': 'CLEANING',
                                  Maintenance: 'MAINTENANCE',
                                  Reserved: 'RESERVED',
                                };
                                const dbStatus = statusMap[newStatus] || 'AVAILABLE';

                                const storedUnits = localStorage.getItem('arventa_units');
                                if (storedUnits) {
                                  try {
                                    const all: Unit[] = JSON.parse(storedUnits);
                                    const updatedAll = all.map((u) => (u.id === unit.id ? { ...u, status: newStatus } : u));
                                    localStorage.setItem('arventa_units', JSON.stringify(updatedAll));
                                  } catch (e) { }
                                }

                                const storedProps = localStorage.getItem('arventa_properties');
                                if (storedProps) {
                                  try {
                                    const props = JSON.parse(storedProps);
                                    const updatedProps = props.map((p: any) => {
                                      if (p.id === id) {
                                        const updatedPU = (p.units || []).map((pu: any) => {
                                          if (pu.id === unit.id || pu.unitNumber === unit.name || pu.name === unit.name) {
                                            return { ...pu, status: dbStatus };
                                          }
                                          return pu;
                                        });
                                        return { ...p, units: updatedPU };
                                      }
                                      return p;
                                    });
                                    localStorage.setItem('arventa_properties', JSON.stringify(updatedProps));
                                  } catch (e) { }
                                }

                                if (typeof window !== 'undefined') {
                                  window.dispatchEvent(new Event('storage'));
                                }

                                try {
                                  await fetch(`/api/units/${unit.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: dbStatus }),
                                  });
                                } catch (err) {
                                  console.warn('API unit status update notice:', err);
                                }
                              }}
                            />
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

            {/* Circular Rate SVG Gauge */}
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <div className="relative flex items-center justify-center h-28 w-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100 dark:text-muted"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#8FA28A]"
                    strokeDasharray={`${rate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-2xl font-black text-gray-800 dark:text-foreground">{rate}%</span>
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

          {/* Property Contract Template Card */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#8FA28A]" />
                Template Kontrak Properti
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-gray-800 text-sm block">
                  {contractTemplate?.templateName || `Template Kontrak ${property.name}`}
                </span>
                <span className="text-[11px] font-medium text-gray-500 mt-0.5 block">
                  {contractTemplate?.customClauses?.length || 0} Klausul Khusus Terkonfigurasi
                </span>
              </div>

              {contractTemplate?.customClauses && contractTemplate.customClauses.length > 0 && (
                <div className="p-3 rounded-xl bg-[#F7F4ED] border border-[#C7D3C0]/30 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Klausul Khusus Bawaan:</span>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-[11px] font-medium">
                    {contractTemplate.customClauses.slice(0, 3).map((clause, idx) => (
                      <li key={idx} className="truncate">{clause}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={async () => {
                  await fetchContractTemplate();
                  setIsTemplateModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#8FA28A]/10 hover:bg-[#8FA28A]/20 text-[#8FA28A] font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4" /> Kelola Template Kontrak
              </button>
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

      {/* Dynamic Bulk Action Modal (Edit Unit Pop-Up) */}
      <Suspense fallback={null}>
        {isBulkModalOpen && (
          <BulkActionModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
            allUnits={units}
            selectedUnits={units.filter((u) => selectedUnitIds.includes(u.id))}
            onApplyBulkAction={handleApplyBulkAction}
          />
        )}
      </Suspense>
      {/* Property Contract Template Modal */}
      <PropertyContractTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        propertyId={property.id}
        propertyName={property.name}
        propertyAddress={property.address}
        ownerName={(property as any).ownerName}
        ownerPhone={(property as any).ownerPhone}
        ownerEmail={(property as any).ownerEmail}
        initialData={contractTemplate}
        onSaved={() => fetchContractTemplate()}
      />
    </div>
  );
}
