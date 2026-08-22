'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Layers,
  User,
  Phone,
  Calendar,
  Info,
  Package,
  ShieldAlert,
  Award,
  Compass,
  DollarSign,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Unit } from '@/app/(dashboard)/units/_types';
import { Property, InventoryItem, InventoryCondition } from '@/app/(dashboard)/properties/_types';
import { useSafeBack } from '@/app/_hooks/useSafeBack';
import AssignTenantModal from '@/app/(dashboard)/units/_components/AssignTenantModal';

const CONDITION_BADGE_STYLE = (cond: InventoryCondition) => {
  switch (cond) {
    case 'Baik':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'Perlu Perbaikan':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    case 'Rusak Berat':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
    case 'Hilang':
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const DEFAULT_INVENTORIES = (propertyId: string, unitId: string, unitName: string): InventoryItem[] => [
  {
    id: `inv-1-${unitId}`,
    propertyId,
    unitId,
    unitName,
    name: 'Air Conditioner (AC) 1 PK',
    condition: 'Baik',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=600',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: `inv-2-${unitId}`,
    propertyId,
    unitId,
    unitName,
    name: 'Kasur Springbed Queen Size',
    condition: 'Baik',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=600',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: `inv-3-${unitId}`,
    propertyId,
    unitId,
    unitName,
    name: 'Lemari Pakaian Kayu 2 Pintu',
    condition: 'Baik',
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=600',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: `inv-4-${unitId}`,
    propertyId,
    unitId,
    unitName,
    name: 'Meja Kerja & Kursi Ergonomis',
    condition: 'Perlu Perbaikan',
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600',
    lastUpdated: new Date().toISOString(),
  },
];

export default function PropertyUnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;
  const unitId = params?.unitId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1 Kamar 1 Akun states
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<'OWNER' | 'HOUSEKEEPING'>('OWNER');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnitData = async () => {
      // 1. Attempt API fetch
      try {
        const res = await fetch(`/api/units/${unitId}`);
        if (res.ok) {
          const json = await res.json();
          const uData = json.data;
          if (uData) {
            let pData: Property | null = null;
            try {
              const pRes = await fetch(`/api/properties/${propertyId}`);
              if (pRes.ok) {
                const pJson = await pRes.json();
                const pRaw = pJson.data;
                if (pRaw) {
                  const typeToCat: Record<string, string> = {
                    KOS: 'cat-1',
                    APARTEMEN: 'cat-2',
                    KONTRAKAN: 'cat-3',
                    RUKO: 'cat-4',
                  };
                  pData = {
                    id: pRaw.id,
                    name: pRaw.name,
                    address: `${pRaw.address}${pRaw.city ? `, ${pRaw.city}` : ''}`,
                    categoryId: typeToCat[pRaw.type] || 'cat-1',
                    statusId: 'st-1',
                    totalUnits: pRaw.units?.length || 0,
                    occupiedUnits: pRaw.units?.filter((u: any) => u.status === 'OCCUPIED' || u.status === 'Occupied').length || 0,
                    description: pRaw.description || '',
                    imageUrl: pRaw.coverImage || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600',
                    hasCleaningService: pRaw.hasCleaningService ?? true,
                    createdAt: pRaw.createdAt || new Date().toISOString(),
                  };
                }
              }
            } catch (err) {
              console.warn('API property detail error:', err);
            }

            if (!pData) {
              const storedProps = localStorage.getItem('arventa_properties');
              if (storedProps) {
                const loadedProps: Property[] = JSON.parse(storedProps);
                pData = loadedProps.find((p) => p.id === propertyId) || null;
              }
            }

            if (!pData) {
              pData = {
                id: propertyId,
                name: uData.propertyName || 'Properti',
                address: 'Bandung',
                categoryId: 'cat-1',
                statusId: 'st-1',
                totalUnits: 1,
                occupiedUnits: uData.status === 'Occupied' ? 1 : 0,
                description: '',
                hasCleaningService: true,
                createdAt: new Date().toISOString(),
              };
            }

            setProperty(pData);
            setUnit(uData);

            const storedInventory = localStorage.getItem('arventa_inventory');
            let loadedInventory: InventoryItem[] = storedInventory ? JSON.parse(storedInventory) : [];
            let unitInventory = (uData.inventories && uData.inventories.length > 0)
              ? uData.inventories
              : loadedInventory.filter((item) => item.unitId === unitId);

            if (unitInventory.length === 0) {
              unitInventory = DEFAULT_INVENTORIES(propertyId, unitId, uData.name);
            }

            setInventories(unitInventory);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('API unit detail error notice: falling back to local storage', err);
      }

      // 2. Fallback to LocalStorage
      const storedProps = localStorage.getItem('arventa_properties');
      const storedUnits = localStorage.getItem('arventa_units');
      const storedInventory = localStorage.getItem('arventa_inventory');

      let loadedProps: Property[] = [];
      let loadedUnits: Unit[] = [];
      let loadedInventory: InventoryItem[] = [];

      if (storedProps) loadedProps = JSON.parse(storedProps);
      if (storedUnits) loadedUnits = JSON.parse(storedUnits);
      if (storedInventory) loadedInventory = JSON.parse(storedInventory);

      const foundProp = loadedProps.find((p) => p.id === propertyId);
      const foundUnit = loadedUnits.find((u) => u.id === unitId);

      if (foundUnit && (!foundUnit.roomEmail || !foundUnit.roomPassword)) {
        const cleanName = foundUnit.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        foundUnit.roomEmail = `${cleanName || 'kamar'}@arventa.id`;
        foundUnit.roomPassword = `Arv!${Math.random().toString(36).substring(2, 8)}`;
        foundUnit.roomPasswordLastReset = new Date().toISOString();

        const updated = loadedUnits.map((u) => (u.id === foundUnit.id ? foundUnit : u));
        localStorage.setItem('arventa_units', JSON.stringify(updated));
      }

      let unitInventory = loadedInventory.filter((item) => item.unitId === unitId);

      if (unitInventory.length === 0 && foundProp && foundUnit) {
        const defaults = DEFAULT_INVENTORIES(propertyId, unitId, foundUnit.name);
        const updatedMasterInventory = [...loadedInventory, ...defaults];
        localStorage.setItem('arventa_inventory', JSON.stringify(updatedMasterInventory));
        unitInventory = defaults;
      }

      setProperty(foundProp || null);
      setUnit(foundUnit || null);
      setInventories(unitInventory);
      setLoading(false);
    };

    fetchUnitData();
  }, [propertyId, unitId]);

  const [isAssignTenantOpen, setIsAssignTenantOpen] = useState(false);

  const handleSaveTenant = async (data: { tenantName: string; tenantPhone: string; checkInDate: string }) => {
    if (!unit) return;
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) =>
        u.id === unit.id
          ? {
              ...u,
              tenantName: data.tenantName,
              tenantPhone: data.tenantPhone,
              checkInDate: data.checkInDate,
              status: 'Occupied' as any,
            }
          : u
      );
      localStorage.setItem('arventa_units', JSON.stringify(updated));
      setUnit({
        ...unit,
        tenantName: data.tenantName,
        tenantPhone: data.tenantPhone,
        checkInDate: data.checkInDate,
        status: 'Occupied' as any,
      });
    }

    // Backend Prisma Lease creation & DB sync
    try {
      await fetch(`/api/units/${unit.id}/lease`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error('Failed to sync lease with database:', e);
    }
  };

  const handleCheckoutTenant = async () => {
    if (!unit || !property) return;
    const nextStatus = (property.hasCleaningService ?? true) ? 'Need Cleaning' : 'Available';
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) =>
        u.id === unit.id
          ? {
              ...u,
              tenantName: undefined,
              tenantPhone: undefined,
              checkInDate: undefined,
              status: nextStatus as any,
              roomPassword: `Arv!${Math.random().toString(36).substring(2, 8)}`,
              roomPasswordLastReset: new Date().toISOString(),
            }
          : u
      );
      localStorage.setItem('arventa_units', JSON.stringify(updated));
      setUnit({
        ...unit,
        tenantName: undefined,
        tenantPhone: undefined,
        checkInDate: undefined,
        status: nextStatus as any,
      });
    }

    // Backend Prisma Lease checkout & DB sync
    try {
      await fetch(`/api/units/${unit.id}/lease`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to checkout lease in database:', e);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleResetRoomPassword = async () => {
    if (!unit) return;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newPass = `Arv!${rand}`;
    const nowIso = new Date().toISOString();

    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) =>
        u.id === unit.id
          ? {
              ...u,
              roomPassword: newPass,
              roomPasswordLastReset: nowIso,
            }
          : u
      );
      localStorage.setItem('arventa_units', JSON.stringify(updated));
      setUnit({ ...unit, roomPassword: newPass, roomPasswordLastReset: nowIso });
      setResetMessage(`Password akun unit berhasil di-reset: ${newPass}`);
      setTimeout(() => setResetMessage(null), 5000);
    }

    // Backend Prisma DB sync
    try {
      await fetch(`/api/units/${unit.id}/reset-password`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to reset password in database:', e);
    }
  };

  const handleToggleHousekeepingService = async () => {
    if (!property) return;
    const nextState = !(property.hasCleaningService ?? true);
    const storedProps = localStorage.getItem('arventa_properties');
    if (storedProps) {
      const allProps: Property[] = JSON.parse(storedProps);
      const updated = allProps.map((p) =>
        p.id === property.id ? { ...p, hasCleaningService: nextState } : p
      );
      localStorage.setItem('arventa_properties', JSON.stringify(updated));
      setProperty({ ...property, hasCleaningService: nextState });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('arventa_task_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    // Backend Prisma DB sync
    try {
      await fetch(`/api/properties/${property.id}/cleaning-service`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState }),
      });
    } catch (e) {
      console.error('Failed to toggle cleaning service in database:', e);
    }
  };

  const handleSafeBack = useSafeBack(`/properties/${propertyId}`);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-muted-foreground">Memuat spesifikasi unit...</p>
        </div>
      </div>
    );
  }

  if (!unit || !property) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center rounded-2xl border border-border dark:border-border bg-card dark:bg-card p-8 text-center text-card-foreground dark:text-card-foreground">
        <ShieldAlert className="h-12 w-12 text-[#C8A96B] mb-3" />
        <h2 className="text-lg font-bold text-foreground dark:text-foreground">Unit Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1 max-w-sm">
          Unit atau properti tidak terdaftar dalam database atau telah dihapus.
        </p>
        <button
          type="button"
          onClick={handleSafeBack}
          className="mt-4 min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Detail Properti
        </button>
      </div>
    );
  }

  const hasCleaningService = property.hasCleaningService ?? true;

  return (
    <div className="space-y-6 bg-background text-foreground dark:bg-background dark:text-foreground min-h-[90vh] p-6 rounded-2xl border border-border dark:border-border">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-border dark:border-border pb-4">
        <button
          type="button"
          onClick={handleSafeBack}
          className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke {property.name}
        </button>

        <div className="flex items-center gap-2">
          {/* Header Actions */}
        </div>
      </div>

      {/* Main Grid: Details & Side Column */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Columns: Specifications & Inventory */}
        <div className="lg:col-span-2 space-y-6">
          {/* Unit Spec Title Card */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border dark:border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-foreground dark:text-foreground">{unit.name}</h2>
                  {(() => {
                    const st = (unit.status as string) || '';
                    const isAvail = st === 'Available' || st === 'AVAILABLE';
                    const isOcc = st === 'Occupied' || st === 'OCCUPIED';
                    const isClean = st === 'Need Cleaning' || st === 'Cleaning' || st === 'CLEANING';
                    const isRes = st === 'Reserved' || st === 'RESERVED';

                    const badgeClass = isAvail
                      ? 'bg-emerald-600 text-white'
                      : isOcc
                      ? 'bg-blue-600 text-white'
                      : isClean
                      ? 'bg-amber-500 text-white'
                      : isRes
                      ? 'bg-purple-600 text-white'
                      : 'bg-rose-600 text-white';

                    const labelText = isAvail
                      ? 'Tersedia'
                      : isOcc
                      ? 'Terisi'
                      : isClean
                      ? 'Perlu Dibersihkan'
                      : isRes
                      ? 'Reserved'
                      : 'Perlu Perbaikan';

                    return <span className={`rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider ${badgeClass}`}>{labelText}</span>;
                  })()}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{property.name} • Lantai {unit.capacity?.dimensions ? 'Dasar/Atas' : '1'}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="block text-xs font-bold text-muted-foreground uppercase">Tarif Sewa</span>
                <p className="text-xl font-black text-[#8FA28A]">
                  {formatRupiah(unit.pricing.monthly)}
                  <span className="text-xs font-normal text-muted-foreground">/bln</span>
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-4 border border-border dark:border-border space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5 text-[#8FA28A]" /> Dimensi Kamar
                </span>
                <p className="text-base font-black text-foreground dark:text-foreground">
                  {unit.capacity.dimensions}
                </p>
              </div>
              <div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-4 border border-border dark:border-border space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-[#8FA28A]" /> Kapasitas Maksimal
                </span>
                <p className="text-base font-black text-foreground dark:text-foreground">
                  {unit.capacity.maxPersons} Orang
                </p>
              </div>
            </div>

            {/* 1 KAMAR 1 AKUN (ROOM CREDENTIALS & PASSWORD RESET) */}
            <div className="rounded-xl border border-[#8FA28A]/40 bg-[#8FA28A]/5 dark:bg-[#8FA28A]/10 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8FA28A]/20 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-[#8FA28A]" />
                  <div>
                    <h3 className="text-sm font-black text-foreground dark:text-foreground flex items-center gap-1.5">
                      Sistem 1 Kamar 1 Akun (Akses Unit)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Kredensial login khusus untuk {unit.name}. Dapat di-reset oleh Owner & Housekeeping.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetRoomPassword}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Generate / Reset Password
                </button>
              </div>

              {resetMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold">
                  ✓ {resetMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-card dark:bg-card p-3.5 rounded-xl border border-border dark:border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Email Login Kamar
                  </span>
                  <span className="font-mono font-bold text-foreground dark:text-foreground select-all">
                    {unit.roomEmail || `${unit.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@arventa.id`}
                  </span>
                </div>

                <div className="bg-card dark:bg-card p-3.5 rounded-xl border border-border dark:border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                      Password Login
                    </span>
                    {userRole === 'OWNER' && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground text-[10px] font-bold flex items-center gap-1"
                      >
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showPassword ? 'Sembunyikan' : 'Lihat'}
                      </button>
                    )}
                  </div>

                  {userRole === 'OWNER' ? (
                    <span className="font-mono font-bold text-[#8FA28A] select-all">
                      {showPassword ? unit.roomPassword || 'Arv!908123' : '••••••••••••'}
                    </span>
                  ) : (
                    <span className="font-mono text-muted-foreground italic">
                      [Disembunyikan untuk Housekeeping - Gunakan Reset Password bila perlu]
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Facilities Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-[#8FA28A]" />
                Fasilitas Unit Kamar
              </h3>
              {unit.facilities.length === 0 ? (
                <p className="text-xs text-muted-foreground">Tidak ada fasilitas terdaftar.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {unit.facilities.map((fac) => (
                    <span
                      key={fac}
                      className="rounded-xl bg-muted dark:bg-muted/60 border border-border dark:border-border px-3.5 py-1.5 text-xs font-bold text-foreground"
                    >
                      {fac}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes/Description */}
            {unit.description && (
              <div className="space-y-2 border-t border-border dark:border-border pt-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Catatan Tambahan
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border dark:border-border">
                  {unit.description}
                </p>
              </div>
            )}
          </div>

          {/* Unit Inventory List */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground dark:text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-[#8FA28A]" />
              Daftar Inventaris & Foto Kondisi Barang
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {inventories.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-border dark:border-border bg-card dark:bg-card shadow-sm hover:shadow transition-shadow flex flex-col"
                >
                  <div className="relative h-44 w-full bg-muted">
                    <img
                      src={
                        item.imageUrl ||
                        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'
                      }
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span
                        className={`rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${CONDITION_BADGE_STYLE(
                          item.condition
                        )}`}
                      >
                        {item.condition}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-black text-foreground dark:text-foreground line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Terakhir diverifikasi:{' '}
                        {new Date(item.lastUpdated).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="text-[11px] text-[#8FA28A] font-semibold mt-3 pt-2 border-t border-border dark:border-border">
                      ✓ Aset Milik Properti {property.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Column: Pricing details, Active Tenant & Housekeeping Service */}
        <div className="space-y-6">
          {/* Financials & Deposits */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-foreground dark:text-foreground border-b border-border dark:border-border pb-3 flex items-center gap-1.5">
              <DollarSign className="h-5 w-5 text-[#8FA28A]" />
              Tarif & Deposit Sewa
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-center justify-between border-b border-border dark:border-border pb-2">
                <span className="text-muted-foreground">Sewa Bulanan (Base)</span>
                <span className="text-sm font-black text-foreground">{formatRupiah(unit.pricing.monthly)}</span>
              </div>

              <div className="flex items-center justify-between border-b border-border dark:border-border pb-2">
                <span className="text-muted-foreground">Sewa Harian (Transit)</span>
                <span className="text-sm font-black text-foreground">
                  {unit.pricing.daily ? formatRupiah(unit.pricing.daily) : 'Tidak Tersedia'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border dark:border-border pb-2">
                <span className="text-muted-foreground">Uang Jaminan / Deposit</span>
                <span className="text-sm font-black text-[#C8A96B]">{formatRupiah(unit.pricing.deposit)}</span>
              </div>
            </div>
          </div>

          {/* TENANT WIDGET (Matching SS 2 & SS 3 + Assign Tenant Action) */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-4">
            {unit.status === 'Occupied' && unit.tenantName ? (
              /* MATCHING SS 2: PENYEWA AKTIF */
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider block">
                      PENYEWA AKTIF
                    </span>
                    <h4 className="text-lg font-black text-foreground dark:text-foreground">
                      {unit.tenantName}
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium">
                      {property.name} • {unit.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAssignTenantOpen(true)}
                    className="px-3 py-1.5 rounded-xl border border-border bg-muted/30 hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1 transition-colors min-h-[36px]"
                  >
                    Edit Penyewa
                  </button>
                </div>

                <div className="space-y-2.5 text-xs pt-2 border-t border-border dark:border-border">
                  {unit.tenantPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" /> WhatsApp
                      </span>
                      <strong className="text-foreground">{unit.tenantPhone}</strong>
                    </div>
                  )}

                  {unit.checkInDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Tanggal Masuk
                      </span>
                      <strong className="text-foreground">
                        {new Date(unit.checkInDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* MATCHING SS 3: INFORMASI PENYEWA KAMAR (EMPTY STATE) + ATUR PENYEWA */
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground dark:text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Informasi Penyewa Kamar
                </h3>
                <div className="rounded-xl border border-dashed border-border dark:border-border bg-muted/20 p-6 text-center space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Unit saat ini dalam keadaan kosong dan siap untuk dipasarkan.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAssignTenantOpen(true)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-black text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    + Atur / Tambah Penyewa Kamar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Owner Housekeeping Service Toggle - Moved below tenant info */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-foreground dark:text-foreground uppercase tracking-wider">
                  Layanan Kebersihan Kamar
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  ON/OFF Layanan Kebersihan oleh Owner
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleHousekeepingService}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                  hasCleaningService
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {hasCleaningService ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {hasCleaningService ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="text-[11px] text-muted-foreground border-t border-border dark:border-border pt-2">
              Status di Info Kamar Tenant:{' '}
              <strong className={hasCleaningService ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {hasCleaningService ? '✓ Layanan Kebersihan Aktif' : '✗ Layanan Kebersihan Nonaktif'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Tenant Modal */}
      {unit && isAssignTenantOpen && (
        <AssignTenantModal
          isOpen={isAssignTenantOpen}
          onClose={() => setIsAssignTenantOpen(false)}
          unit={unit}
          onSaveTenant={handleSaveTenant}
          onCheckoutTenant={handleCheckoutTenant}
        />
      )}
    </div>
  );
}
