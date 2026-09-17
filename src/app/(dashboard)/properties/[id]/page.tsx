'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Edit3, Trash2, Home, Layers, Calendar, Info, Users, ShieldAlert, Package, Plus, Sparkles, ArrowRight, Check, FileText, Settings, AlertTriangle, Loader2, UserPlus, Phone } from 'lucide-react';
import { Property, PropertyCategory, PropertyStatus } from '../_types';
import PropertyFormModal from '../_components/PropertyFormModal';
import PropertyContractTemplateModal from '../_components/PropertyContractTemplateModal';
import InventoryManager from '../_components/InventoryManager';
import { Unit, UnitStatus } from '../../units/_types';
import UnitStatusBadgeDropdown from '../../units/_components/UnitStatusBadgeDropdown';
import { useSafeBack } from '@/app/_hooks/useSafeBack';

const UnitFormModal = lazy(() => import('../../units/_components/UnitFormModal'));
const BulkActionModal = lazy(() => import('../../units/_components/BulkActionModal'));

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

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const handleSafeBack = useSafeBack('/properties');

  const [property, setProperty] = useState<Property | null>(null);
  const [categories, setCategories] = useState<PropertyCategory[]>(DEFAULT_CATEGORIES);
  const [statuses, setStatuses] = useState<PropertyStatus[]>(DEFAULT_STATUSES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inventoryKey, setInventoryKey] = useState(0);

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

  // Housekeeping staff state
  const [housekeepingStaff, setHousekeepingStaff] = useState<any[]>([]);
  const [loadingHousekeeping, setLoadingHousekeeping] = useState(true);

  const fetchHousekeeping = async () => {
    setLoadingHousekeeping(true);
    try {
      const res = await fetch(`/api/operations/housekeeping?propertyId=${id}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setHousekeepingStaff(json.data);
          setLoadingHousekeeping(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch property housekeeping staff:', e);
    }
    setLoadingHousekeeping(false);
  };

  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [unitFormDefaultMode, setUnitFormDefaultMode] = useState<'single' | 'batch'>('single');
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Bulk edit state
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Custom Delete Unit Confirmation State
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'units' | 'inventory'>('units');

  const loadData = async () => {
    try {
      const res = await fetch(`/api/properties/${id}`);
      if (res.ok) {
        const json = await res.json();
        const p = json.data;
        if (p) {
          if (Array.isArray(p.housekeepingStaff)) {
            setHousekeepingStaff(p.housekeepingStaff);
            setLoadingHousekeeping(false);
          }
          const typeToCat: Record<string, string> = {
            KOS: 'cat-1',
            APARTEMEN: 'cat-2',
            KONTRAKAN: 'cat-3',
            RUKO: 'cat-4',
          };
          const statusMap: Record<string, UnitStatus> = {
            AVAILABLE: 'Available',
            Available: 'Available',
            OCCUPIED: 'Occupied',
            Occupied: 'Occupied',
            MAINTENANCE: 'Maintenance',
            Maintenance: 'Maintenance',
            CLEANING: 'Need Cleaning',
            Cleaning: 'Need Cleaning',
            NEED_CLEANING: 'Need Cleaning',
            'Need Cleaning': 'Need Cleaning',
            RESERVED: 'Reserved',
            Reserved: 'Reserved',
          };

          const occupiedUnitsCount = p.units?.filter((u: any) => 
            u.status === 'OCCUPIED' || 
            u.status === 'Occupied' || 
            u.rawStatus === 'OCCUPIED' || 
            Boolean(u.tenantName) || 
            (u.leases && u.leases.length > 0)
          ).length || 0;
          const totalUnitsCount = p.units?.length || 0;
          const isFullyOccupied = totalUnitsCount > 0 && occupiedUnitsCount === totalUnitsCount;

          let computedStatusId = 'st-1';
          if (p.status === 'MAINTENANCE' || p.statusId === 'st-3') {
            computedStatusId = 'st-3';
          } else if (p.status === 'INACTIVE' || p.status === 'NONAKTIF' || p.statusId === 'st-2') {
            computedStatusId = 'st-2';
          } else if (isFullyOccupied) {
            computedStatusId = 'st-4';
          }

          const mappedProp: Property = {
            id: p.id,
            name: p.name,
            address: p.address,
            city: p.city || '',
            categoryId: typeToCat[p.type] || 'cat-1',
            statusId: computedStatusId,
            totalUnits: totalUnitsCount,
            occupiedUnits: occupiedUnitsCount,
            description: p.description || '',
            imageUrl: p.coverImage || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600',
            hasCleaningService: p.hasCleaningService ?? true,
            defaultLateFee: Number(p.defaultLateFee || 50000),
            defaultDeposit: Number(p.defaultDeposit || 0),
            hasWifi: Boolean(p.hasWifi),
            wifiSsid: p.wifiSsid || '',
            wifiPassword: p.wifiPassword || '',
            hasSmartLock: Boolean(p.hasSmartLock),
            createdAt: p.createdAt || new Date().toISOString(),
            ownerName: p.owner?.fullName || p.ownerName,
            ownerPhone: p.owner?.phoneNumber || p.ownerPhone,
            ownerEmail: p.owner?.email || p.ownerEmail,
          };

          const mappedUnits: Unit[] = (p.units || []).map((u: any) => {
            const activeLease = u.leases?.[0] || u.activeLease;
            const tenant = activeLease?.tenant;
            const hasActiveLease = Boolean(activeLease);
            const isOccupied = hasActiveLease || u.status === 'OCCUPIED' || u.status === 'Occupied' || u.rawStatus === 'OCCUPIED' || Boolean(u.tenantName);
            const mappedStatus: UnitStatus = isOccupied ? 'Occupied' : (statusMap[u.status] || (typeof u.status === 'string' && u.status.toLowerCase().includes('clean') ? 'Need Cleaning' : 'Available'));
            
            const maxPersons = typeof u.capacity === 'object' && u.capacity !== null
              ? Number(u.capacity.maxPersons || 1)
              : Number(u.capacity || 1);
            const dimensions = typeof u.capacity === 'object' && u.capacity !== null && u.capacity.dimensions
              ? String(u.capacity.dimensions)
              : (u.dimensions || (u.floor ? `Lantai ${u.floor}` : '3x4 m'));

            const monthlyPrice = typeof u.pricing === 'object' && u.pricing !== null
              ? Number(u.pricing.monthly || 0)
              : Number(u.basePrice || 0);
            const dailyPrice = typeof u.pricing === 'object' && u.pricing !== null
              ? u.pricing.daily
              : (u.transitPrice ? Number(u.transitPrice) : (u.dailyPrice ? Number(u.dailyPrice) : undefined));
            const depositPrice = typeof u.pricing === 'object' && u.pricing !== null
              ? Number(u.pricing.deposit || 0)
              : (u.deposit !== undefined && u.deposit !== null ? Number(u.deposit) : 0);

            return {
              id: u.id,
              propertyId: p.id,
              name: u.unitNumber || u.name,
              status: mappedStatus,
              facilities: Array.isArray(u.facilities) ? u.facilities : ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Kasur Springbed'],
              capacity: {
                maxPersons: isNaN(maxPersons) ? 1 : maxPersons,
                dimensions,
              },
              pricing: {
                monthly: monthlyPrice,
                daily: dailyPrice,
                deposit: depositPrice,
                utilities: u.utilities || '',
              },
              description: u.description || (u.floor ? `Lantai ${u.floor}` : ''),
              tenantName: isOccupied ? (tenant?.fullName || tenant?.user?.fullName || u.tenantName || '') : undefined,
              tenantPhone: isOccupied ? (tenant?.phoneNumber || tenant?.user?.phoneNumber || u.tenantPhone || '') : undefined,
              checkInDate: isOccupied && activeLease?.startDate ? (typeof activeLease.startDate === 'string' ? activeLease.startDate.split('T')[0] : new Date(activeLease.startDate).toISOString().split('T')[0]) : (isOccupied ? (u.checkInDate || '') : undefined),
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

    const finalCats = currentCats && currentCats.length > 0 ? currentCats : DEFAULT_CATEGORIES;
    const finalStats = currentStats && currentStats.length > 0 ? currentStats : DEFAULT_STATUSES;

    const found = currentProps.find((p) => p.id === id);
    const propUnits = currentUnits.filter((u) => u.propertyId === id).map((u) => ({
      ...u,
      tenantName: u.status === 'Occupied' ? u.tenantName : undefined,
      tenantPhone: u.status === 'Occupied' ? u.tenantPhone : undefined,
    }));

    setCategories(finalCats);
    setStatuses(finalStats);
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
    fetchHousekeeping();
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
            basePrice: data.pricing.monthly || (data.pricing.yearly ? Math.round(data.pricing.yearly / 12) : 0),
            transitPrice: data.pricing.daily,
            deposit: data.pricing.deposit,
            capacity: data.capacity.maxPersons,
            dimensions: data.capacity.dimensions,
            facilities: data.facilities,
            description: data.description,
            tenantName: data.tenantName,
            tenantPhone: data.tenantPhone,
            checkInDate: data.checkInDate,
            inventoryIds: data.inventoryIds,
            smartLockPin: data.smartLockPin,
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
          basePrice: d.pricing.monthly || (d.pricing.yearly ? Math.round(d.pricing.yearly / 12) : 0),
          transitPrice: d.pricing.daily,
          deposit: d.pricing.deposit,
          capacity: d.capacity.maxPersons,
          dimensions: d.capacity.dimensions,
          facilities: d.facilities,
          description: d.description,
          inventoryIds: d.inventoryIds,
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

  const triggerDeleteUnit = (unit: Unit, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setUnitToDelete(unit);
  };

  const confirmDeleteUnit = async () => {
    if (!unitToDelete || isDeletingUnit) return;
    setIsDeletingUnit(true);

    const unitId = unitToDelete.id;

    // 1. Update local state
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.filter((u) => u.id !== unitId);
      saveAllUnits(updated);
    } else {
      setUnits((prev) => prev.filter((u) => u.id !== unitId));
    }

    // 2. Also update property cache
    const storedProps = localStorage.getItem('arventa_properties');
    if (storedProps) {
      try {
        const props = JSON.parse(storedProps);
        const updatedProps = props.map((p: any) => {
          if (p.id === id) {
            return { ...p, units: (p.units || []).filter((pu: any) => pu.id !== unitId) };
          }
          return p;
        });
        localStorage.setItem('arventa_properties', JSON.stringify(updatedProps));
      } catch (e) {}
    }

    // 3. Backend Prisma DB delete
    try {
      await fetch(`/api/units/${unitId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete unit in database:', err);
    } finally {
      setIsDeletingUnit(false);
      setUnitToDelete(null);
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

  const handleEditProperty = async (data: Omit<Property, 'id' | 'createdAt'>) => {
    const catToType: Record<string, string> = {
      'cat-1': 'KOS',
      'cat-2': 'APARTEMEN',
      'cat-3': 'KONTRAKAN',
      'cat-4': 'RUKO',
    };

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          address: data.address,
          city: data.city,
          type: catToType[data.categoryId] || 'KOS',
          description: data.description,
          coverImage: data.imageUrl,
          hasCleaningService: data.hasCleaningService,
          hasWifi: data.hasWifi,
          wifiSsid: data.wifiSsid,
          wifiPassword: data.wifiPassword,
          hasSmartLock: data.hasSmartLock,
        }),
      });

      if (res.ok) {
        await loadData();
        setInventoryKey((prev) => prev + 1);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('arventa_inventory_updated'));
          window.dispatchEvent(new Event('storage'));
        }
        setIsFormOpen(false);
        return;
      } else {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Gagal memperbarui properti');
      }
    } catch (e: any) {
      console.error('Failed to update property in database:', e);
      throw e;
    }
  };

  const handleDeleteProperty = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus properti ini beserta seluruh unit di dalamnya?')) {
      try {
        const res = await fetch(`/api/properties/${property?.id || id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          router.push('/properties');
          return;
        }
      } catch (err) {
        console.error('Failed to delete property in database:', err);
      }

      const storedProps = localStorage.getItem('arventa_properties');
      if (storedProps) {
        const allProps: Property[] = JSON.parse(storedProps);
        const updated = allProps.filter((p) => p.id !== (property?.id || id));
        localStorage.setItem('arventa_properties', JSON.stringify(updated));
      }
      router.push('/properties');
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Fallback image helper
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

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-card text-card-foreground rounded-2xl border border-border p-6">
        <div className="text-center space-y-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-xs text-muted-foreground font-bold tracking-wide">Memuat rincian properti & unit...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center rounded-2xl border border-border bg-card text-card-foreground p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-[#C8A96B] mb-3" />
        <h2 className="text-lg font-bold text-foreground">Properti Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Properti yang Anda cari tidak terdaftar atau telah dihapus.
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
  const displayImage = property.imageUrl || getFallbackImage(category?.name);

  const total = units.length;
  const occupied = units.filter((u) => u.status === 'Occupied').length;
  const vacant = Math.max(0, total - occupied);
  const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div className="space-y-6 bg-background min-h-[90vh] p-4 sm:p-6 rounded-2xl border border-border">
      {/* Navigation Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <button
          type="button"
          onClick={handleSafeBack}
          className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-[#8FA28A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Listing Properti
        </button>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFormOpen(true)}
            className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-xs"
          >
            <Edit3 className="h-4 w-4 text-[#8FA28A]" />
            Ubah Properti
          </button>
          <button
            onClick={handleDeleteProperty}
            className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-card px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-all shadow-xs"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            Hapus Properti
          </button>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Image, Badges, Name, Details, and Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
            {/* Property Hero Image */}
            <div className="relative h-72 w-full overflow-hidden bg-muted">
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
                    <span className="inline-block rounded-full bg-background/95 backdrop-blur-xs px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm border border-border/50">
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
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Alamat Properti:</span>
                  <p className="mt-0.5 text-muted-foreground">
                    {property.address}
                    {property.city && `, ${property.city}`}
                  </p>
                </div>
              </div>

              {property.description && (
                <div className="pt-4 border-t border-border space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Tentang Properti</span>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{property.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('units')}
                className={`flex items-center gap-1.5 pb-2 text-sm font-black border-b-2 transition-all ${activeTab === 'units'
                  ? 'border-[#8FA28A] text-[#8FA28A]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Home className="h-4 w-4" />
                Unit ({units.length})
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-1.5 pb-2 text-sm font-black border-b-2 transition-all ${activeTab === 'inventory'
                  ? 'border-[#8FA28A] text-[#8FA28A]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Package className="h-4 w-4" />
                Inventaris Fasilitas
              </button>
            </div>

            <Link
              href={`/operations/maintenance-reports?propertyId=${id}`}
              className="pb-2 text-xs font-bold text-[#8FA28A] hover:underline flex items-center gap-1"
            >
              <span>Lihat Laporan & Maintenance Properti</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Switchable Sections */}
          {activeTab === 'units' ? (
            <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
              {/* Unit Section Header with Creation Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                    <Home className="h-5 w-5 text-[#8FA28A]" />
                    Daftar Unit
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Total {units.length} Unit terdaftar di properti ini</p>
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
                    className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground px-3.5 py-2 text-xs font-bold transition-all shadow-sm"
                  >
                    <Edit3 className="h-4 w-4 text-[#8FA28A]" />
                    Edit Unit
                  </button>
                </div>
              </div>

              {units.length === 0 ? (
                <div className="text-center py-10 space-y-3 border-2 border-dashed border-border rounded-2xl p-6">
                  <Home className="h-10 w-10 text-muted-foreground/60 mx-auto" />
                  <p className="text-xs text-muted-foreground">Belum ada unit yang terdaftar di properti ini.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setEditingUnit(null);
                        setIsUnitFormOpen(true);
                      }}
                      className="text-xs font-bold text-[#8FA28A] hover:underline"
                    >
                      Tambah Unit
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
                          ? 'border-blue-200/60 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/20'
                          : 'border-border bg-card hover:border-[#8FA28A]/50'
                          }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/properties/${id}/units/${unit.id}`}
                                className="text-sm font-black text-foreground hover:text-[#8FA28A] transition-colors"
                              >
                                {unit.name}
                              </Link>
                              <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                                {(typeof unit.capacity === 'object' && unit.capacity !== null ? (unit.capacity.dimensions || '3x4 m') : '3x4 m')} • Max {(typeof unit.capacity === 'object' && unit.capacity !== null ? (typeof unit.capacity.maxPersons === 'object' ? 1 : unit.capacity.maxPersons || 1) : (unit.capacity || 1))} Orang
                              </p>
                            </div>

                            {/* Inline Custom Status Badge Dropdown */}
                            <UnitStatusBadgeDropdown
                              status={unit.status}
                              onChange={async (newStatus) => {
                                const isOcc = newStatus === 'Occupied';
                                const updatedUnits = units.map((u) => (
                                  u.id === unit.id
                                    ? {
                                      ...u,
                                      status: newStatus,
                                      tenantName: isOcc ? u.tenantName : undefined,
                                      tenantPhone: isOcc ? u.tenantPhone : undefined,
                                    }
                                    : u
                                ));
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
                                    const updatedAll = all.map((u) => (
                                      u.id === unit.id
                                        ? {
                                          ...u,
                                          status: newStatus,
                                          tenantName: isOcc ? u.tenantName : undefined,
                                          tenantPhone: isOcc ? u.tenantPhone : undefined,
                                        }
                                        : u
                                    ));
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
                                            return {
                                              ...pu,
                                              status: dbStatus,
                                              tenantName: isOcc ? pu.tenantName : undefined,
                                              tenantPhone: isOcc ? pu.tenantPhone : undefined,
                                            };
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

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                            <span className="font-black text-[#8FA28A]">
                              {formatRupiah(unit.pricing.monthly)}
                              <span className="text-[10px] font-semibold text-muted-foreground">/bln</span>
                            </span>
                            {unit.status === 'Occupied' && unit.tenantName && (
                              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate max-w-[120px]">
                                Penyewa: {unit.tenantName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inline Actions (Edit, Delete, Detail) */}
                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-border">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => triggerEditUnit(unit, e)}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                              title="Edit Unit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={isRoomOccupied}
                              onClick={(e) => {
                                if (isRoomOccupied) return;
                                triggerDeleteUnit(unit, e);
                              }}
                              className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors ${
                                isRoomOccupied
                                  ? 'text-muted-foreground/30 cursor-not-allowed opacity-40 hover:bg-transparent'
                                  : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer'
                              }`}
                              title={isRoomOccupied ? 'Unit sedang terisi oleh penyewa, tidak dapat dihapus' : 'Hapus Unit'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <Link
                            href={`/properties/${id}/units/${unit.id}`}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-muted hover:bg-[#8FA28A] hover:text-white font-bold text-xs text-foreground transition-colors flex items-center gap-1"
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
              <InventoryManager
                key={inventoryKey}
                propertyId={property.id}
                propertyName={property.name}
                propertyType={property.categoryId || (property as any).type}
              />
            </div>
          )}
        </div>

        {/* Right Column: Statistics / Metrics Overview */}
        <div className="space-y-6">
          {/* Summary/Occupancy Card */}
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-1.5">
              <Info className="h-5 w-5 text-[#8FA28A]" />
              Ringkasan Keterisian
            </h3>

            {/* Circular Rate SVG Gauge */}
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <div className="relative flex items-center justify-center h-28 w-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted"
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
                <span className="absolute text-2xl font-black text-foreground">{rate}%</span>
              </div>
              <p className="text-xs font-bold text-[#8FA28A] uppercase tracking-wide">Tingkat Keterisian</p>
            </div>

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="bg-muted/40 rounded-xl p-2.5 border border-border">
                <span className="block text-xs font-bold text-muted-foreground">Total</span>
                <span className="text-lg font-black text-foreground">{total}</span>
              </div>
              <div className="bg-[#8FA28A]/10 rounded-xl p-2.5 border border-[#8FA28A]/20">
                <span className="block text-xs font-bold text-[#8FA28A]">Terisi</span>
                <span className="text-lg font-black text-[#8FA28A]">{occupied}</span>
              </div>
              <div className="bg-muted/40 rounded-xl p-2.5 border border-border">
                <span className="block text-xs font-bold text-muted-foreground">Kosong</span>
                <span className="text-lg font-black text-muted-foreground">{vacant}</span>
              </div>
            </div>
          </div>

          {/* Quick Info & Metadata */}
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Detail Sistem</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Ditambahkan pada
                </span>
                <span className="font-semibold text-foreground">
                  {new Date(property.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  Kategori
                </span>
                <span className="font-semibold text-foreground">{category?.name || 'Umum'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  Role Pengelola
                </span>
                <span className="font-semibold text-[#8FA28A]">Pemilik Properti</span>
              </div>
            </div>
          </div>

          {/* Tim Housekeeping Bertugas Card */}
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#8FA28A]" />
                Housekeeping Bertugas
              </h3>
              {housekeepingStaff.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8FA28A]/15 text-[#8FA28A]">
                  {housekeepingStaff.length} Petugas
                </span>
              )}
            </div>

            {loadingHousekeeping ? (
              <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#8FA28A]" />
                <span>Memuat data petugas...</span>
              </div>
            ) : housekeepingStaff.length > 0 ? (
              <div className="space-y-3">
                <div className="divide-y divide-border">
                  {housekeepingStaff.map((staff) => (
                    <div key={staff.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative h-9 w-9 rounded-xl bg-[#8FA28A]/15 text-[#8FA28A] font-black text-xs flex items-center justify-center shrink-0 overflow-hidden border border-[#8FA28A]/30">
                          {staff.avatarUrl ? (
                            <img src={staff.avatarUrl} alt={staff.fullName} className="h-full w-full object-cover" />
                          ) : (
                            <span>{staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'H'}</span>
                          )}
                          <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-card ${staff.isActive !== false ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{staff.fullName}</p>
                          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{staff.phoneNumber || staff.email || '-'}</span>
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                        staff.isActive !== false
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {staff.isActive !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/operations/housekeeping-team`}
                  className="w-full py-2 px-3 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-border"
                >
                  <span>Kelola di Tim Housekeeping</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </div>
            ) : (
              /* Empty State when no housekeeping is assigned */
              <div className="space-y-3 text-center py-2">
                <div className="h-10 w-10 rounded-2xl bg-[#8FA28A]/10 text-[#8FA28A] flex items-center justify-center mx-auto">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Belum Ada Housekeeping</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Belum ada petugas housekeeping yang ditugaskan di properti ini.
                  </p>
                </div>
                <Link
                  href={`/operations/housekeeping-team`}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#8FA28A] hover:bg-[#7D9178] text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Tambah Tim Housekeeping</span>
                </Link>
              </div>
            )}
          </div>

          {/* Property Contract Template Card */}
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#8FA28A]" />
                Template Kontrak Properti
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-foreground text-sm block">
                  {contractTemplate?.templateName || `Template Kontrak ${property.name}`}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground mt-0.5 block">
                  {contractTemplate?.customClauses?.length || 'Tidak Ada'} Klausul Khusus Terkonfigurasi
                </span>
              </div>

              {contractTemplate?.customClauses && contractTemplate.customClauses.length > 0 && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Klausul Khusus Bawaan:</span>
                  <ul className="list-disc list-inside text-foreground space-y-1 text-[11px] font-medium">
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
              Unit <strong className="text-foreground">{unitToDelete.name}</strong> beserta riwayat inventaris di dalamnya akan dihapus dari properti ini.
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
