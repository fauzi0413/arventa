'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  ShieldAlert,
  Phone,
  UserCheck,
  DollarSign,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  User,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Unit, UnitStatus } from '../_types';
import UnitFormModal from '../_components/UnitFormModal';
import AssignTenantModal from '../_components/AssignTenantModal';
import { Property } from '../../properties/_types';
import { useSafeBack } from '@/app/_hooks/useSafeBack';

export default function UnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const handleSafeBack = useSafeBack('/units');

  const [unit, setUnit] = useState<Unit | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignTenantOpen, setIsAssignTenantOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1 Kamar 1 Akun State
  const [showPassword, setShowPassword] = useState(false);
  const [userRole] = useState<'OWNER' | 'HOUSEKEEPING'>('OWNER');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedProps = localStorage.getItem('arventa_properties');
    const storedUnits = localStorage.getItem('arventa_units');

    let loadedProps: Property[] = [];
    let loadedUnits: Unit[] = [];

    if (storedProps) loadedProps = JSON.parse(storedProps);
    if (storedUnits) loadedUnits = JSON.parse(storedUnits);

    const found = loadedUnits.find((u) => u.id === id);

    // Auto generate room credentials if missing
    if (found && (!found.roomEmail || !found.roomPassword)) {
      const cleanName = found.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      found.roomEmail = `${cleanName || 'kamar'}@arventa.id`;
      found.roomPassword = `Arv!${Math.random().toString(36).substring(2, 8)}`;
      found.roomPasswordLastReset = new Date().toISOString();

      const updated = loadedUnits.map((u) => (u.id === found.id ? found : u));
      localStorage.setItem('arventa_units', JSON.stringify(updated));
    }

    const timer = setTimeout(() => {
      setProperties(loadedProps);
      if (found) {
        setUnit(found);
      }
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-muted-foreground">Memuat detail unit...</p>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center rounded-2xl border border-border dark:border-border bg-card dark:bg-card p-8 text-center text-card-foreground dark:text-card-foreground">
        <ShieldAlert className="h-12 w-12 text-[#C8A96B] mb-3" />
        <h2 className="text-lg font-bold text-foreground dark:text-foreground">Unit Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1 max-w-sm">
          Unit kamar yang Anda cari tidak terdaftar atau telah dihapus.
        </p>
        <button
          type="button"
          onClick={handleSafeBack}
          className="mt-4 min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Unit
        </button>
      </div>
    );
  }

  const property = properties.find((p) => p.id === unit.propertyId);
  const hasCleaningService = property?.hasCleaningService ?? true;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleEditUnit = async (data: Omit<Unit, 'id' | 'createdAt'>) => {
    // Optimistic local update
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) =>
        u.id === unit.id ? { ...u, ...data } : u
      );
      localStorage.setItem('arventa_units', JSON.stringify(updated));
      setUnit({ ...unit, ...data });
    }

    // Backend Prisma DB sync
    try {
      await fetch(`/api/units/${unit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error('Failed to sync unit edit with database:', e);
    }
  };

  const handleDeleteUnit = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
      const storedUnits = localStorage.getItem('arventa_units');
      if (storedUnits) {
        const allUnits: Unit[] = JSON.parse(storedUnits);
        const updated = allUnits.filter((u) => u.id !== unit.id);
        localStorage.setItem('arventa_units', JSON.stringify(updated));
      }

      // Backend Prisma DB delete
      try {
        await fetch(`/api/units/${unit.id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete unit in database:', e);
      }

      router.push('/units');
    }
  };

  const updateStatus = async (newStatus: UnitStatus) => {
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) =>
        u.id === unit.id ? { ...u, status: newStatus } : u
      );
      localStorage.setItem('arventa_units', JSON.stringify(updated));
      setUnit({ ...unit, status: newStatus });
    }

    // Backend Prisma DB sync
    try {
      await fetch(`/api/units/${unit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus === 'Need Cleaning' ? 'CLEANING' : newStatus.toUpperCase() }),
      });
    } catch (e) {
      console.error('Failed to sync unit status with database:', e);
    }
  };

  // 1 Kamar 1 Akun Password Reset Handler (Accessible by both Owner & Housekeeping)
  const handleResetRoomPassword = async () => {
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
      setResetMessage(`Password akun kamar berhasil diperbarui: ${newPass}`);
      setTimeout(() => setResetMessage(null), 5000);
    }

    // Backend Prisma DB sync
    try {
      await fetch(`/api/units/${unit.id}/reset-password`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to reset room password in database:', e);
    }
  };

  // Toggle Property Housekeeping Service (Owner Action)
  const handleToggleHousekeepingService = async () => {
    if (!property) return;
    const nextCleaningState = !hasCleaningService;
    const storedProps = localStorage.getItem('arventa_properties');
    if (storedProps) {
      const allProps: Property[] = JSON.parse(storedProps);
      const updatedProps = allProps.map((p) =>
        p.id === property.id ? { ...p, hasCleaningService: nextCleaningState } : p
      );
      localStorage.setItem('arventa_properties', JSON.stringify(updatedProps));
      setProperties(updatedProps);
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
        body: JSON.stringify({ enabled: nextCleaningState }),
      });
    } catch (e) {
      console.error('Failed to toggle cleaning service in database:', e);
    }
  };

  const handleSaveTenant = async (data: { tenantName: string; tenantPhone: string; checkInDate: string }) => {
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits && unit) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) =>
        u.id === unit.id
          ? {
              ...u,
              tenantName: data.tenantName,
              tenantPhone: data.tenantPhone,
              checkInDate: data.checkInDate,
              status: 'Occupied' as UnitStatus,
            }
          : u
      );
      localStorage.setItem('arventa_units', JSON.stringify(updated));
      setUnit({
        ...unit,
        tenantName: data.tenantName,
        tenantPhone: data.tenantPhone,
        checkInDate: data.checkInDate,
        status: 'Occupied',
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
      console.error('Failed to create lease in database:', e);
    }
  };

  const handleCheckoutTenant = async () => {
    if (!unit) return;
    const nextStatus: UnitStatus = hasCleaningService ? 'Need Cleaning' : 'Available';
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
              status: nextStatus,
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
        status: nextStatus,
      });
    }

    // Backend Prisma Lease checkout & DB sync
    try {
      await fetch(`/api/units/${unit.id}/lease`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to checkout lease in database:', e);
    }
  };

  return (
    <div className="space-y-6 bg-background text-foreground dark:bg-background dark:text-foreground min-h-[90vh] p-4 sm:p-6 rounded-2xl border border-border dark:border-border">
      {/* Top Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border dark:border-border pb-4">
        <button
          type="button"
          onClick={handleSafeBack}
          className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Listing Unit
        </button>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsFormOpen(true)}
            className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-border bg-card dark:bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-sm"
          >
            <Edit3 className="h-4 w-4 text-[#8FA28A]" />
            Ubah Unit
          </button>
          <button
            onClick={handleDeleteUnit}
            className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-card dark:bg-card px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-all shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Unit
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Card: Core Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-border dark:border-border pb-4">
              <div>
                <h2 className="text-2xl font-black text-foreground dark:text-foreground">{unit.name}</h2>
                <p className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground mt-1">
                  {property?.name || 'Properti Lain'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{property?.address}</p>
              </div>

              {/* Status Badge */}
              <span
                className={`rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider ${
                  unit.status === 'Available'
                    ? 'bg-[#8FA28A] text-white'
                    : unit.status === 'Occupied'
                    ? 'bg-blue-600 text-white'
                    : unit.status === 'Need Cleaning'
                    ? 'bg-[#C8A96B] text-white'
                    : unit.status === 'Reserved'
                    ? 'bg-purple-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {unit.status === 'Available'
                  ? 'Tersedia'
                  : unit.status === 'Occupied'
                  ? 'Terisi'
                  : unit.status === 'Need Cleaning'
                  ? 'Perlu Dibersihkan'
                  : unit.status === 'Reserved'
                  ? 'Reserved'
                  : 'Perbaikan'}
              </span>
            </div>

            {/* Capacity & Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-4 border border-border dark:border-border space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Kapasitas Maksimal
                </span>
                <p className="text-base font-black text-foreground dark:text-foreground">
                  {unit.capacity.maxPersons} Orang
                </p>
              </div>
              <div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-4 border border-border dark:border-border space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Ukuran / Dimensi
                </span>
                <p className="text-base font-black text-foreground dark:text-foreground">
                  {unit.capacity.dimensions}
                </p>
              </div>
            </div>

            {/* 1 KAMAR 1 AKUN (ROOM DEDICATED ACCOUNT & ACCESS CREDENTIALS) */}
            <div className="rounded-xl border border-[#8FA28A]/40 bg-[#8FA28A]/5 dark:bg-[#8FA28A]/10 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8FA28A]/20 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-[#8FA28A]" />
                  <div>
                    <h3 className="text-sm font-black text-foreground dark:text-foreground flex items-center gap-1.5">
                      Sistem 1 Kamar 1 Akun (Kredensial Unit)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Akun permanen khusus unit {unit.name}. Akses di-generate per kamar bukan per penyewa.
                    </p>
                  </div>
                </div>

                {/* Reset Password Button (Accessible by both Owner and Housekeeping) */}
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
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold animate-in fade-in">
                  ✓ {resetMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-card dark:bg-card p-3.5 rounded-xl border border-border dark:border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Email / ID Login Kamar
                  </span>
                  <span className="font-mono font-bold text-foreground dark:text-foreground select-all">
                    {unit.roomEmail || `${unit.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@arventa.id`}
                  </span>
                </div>

                <div className="bg-card dark:bg-card p-3.5 rounded-xl border border-border dark:border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                      Password Akun Kamar
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
                      {showPassword ? unit.roomPassword || 'Arv!789210' : '••••••••••••'}
                    </span>
                  ) : (
                    <span className="font-mono text-muted-foreground italic">
                      [Terselubung untuk Housekeeping - Gunakan tombol Reset bila diperlukan]
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <span>Terakhir di-reset: {unit.roomPasswordLastReset ? new Date(unit.roomPasswordLastReset).toLocaleString('id-ID') : 'Saat pembuatan unit'}</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-foreground dark:text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-[#8FA28A]" /> Skema Harga & Penagihan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-border dark:border-border bg-muted/30">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Sewa Bulanan
                  </span>
                  <span className="text-base font-black text-[#8FA28A]">
                    {formatRupiah(unit.pricing.monthly)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-border dark:border-border bg-muted/30">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Sewa Harian
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {unit.pricing.daily ? formatRupiah(unit.pricing.daily) : 'Tidak disewakan harian'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-border dark:border-border bg-muted/30">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Deposit Jaminan
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {formatRupiah(unit.pricing.deposit)}
                  </span>
                </div>
              </div>
              {unit.pricing.utilities && (
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                  Catatan Biaya: {unit.pricing.utilities}
                </div>
              )}
            </div>

            {/* Facilities */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-foreground dark:text-foreground uppercase tracking-wider">
                Fasilitas Kamar
              </h3>
              <div className="flex flex-wrap gap-2">
                {unit.facilities.map((fac) => (
                  <span
                    key={fac}
                    className="rounded-xl bg-muted dark:bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground border border-border dark:border-border"
                  >
                    {fac}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2 border-t border-border dark:border-border">
              <h3 className="text-xs font-black text-foreground dark:text-foreground uppercase tracking-wider">
                Deskripsi / Catatan
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {unit.description || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Card: Quick Status, Tenant Widget & Housekeeping Toggle */}
        <div className="space-y-6">
          {/* OWNER: Housekeeping Service Toggle (Layanan Kebersihan Kamar) */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-foreground dark:text-foreground uppercase tracking-wider">
                  Layanan Kebersihan Kamar
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Pengaturan fitur kebersihan housekeeping dari Owner
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleHousekeepingService}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                  hasCleaningService
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {hasCleaningService ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {hasCleaningService ? 'AKTIF (ON)' : 'NONAKTIF (OFF)'}
              </button>
            </div>
          </div>

          {/* Quick Status Control */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-foreground dark:text-foreground uppercase tracking-wider">
              Ubah Status Cepat
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateStatus('Available')}
                className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  unit.status === 'Available'
                    ? 'bg-[#8FA28A] text-white border-[#8FA28A]'
                    : 'bg-muted/40 text-foreground border-border hover:bg-muted'
                }`}
              >
                Tersedia
              </button>
              <button
                type="button"
                onClick={() => updateStatus('Occupied')}
                className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  unit.status === 'Occupied'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-muted/40 text-foreground border-border hover:bg-muted'
                }`}
              >
                Terisi
              </button>

              {hasCleaningService && (
                <button
                  type="button"
                  onClick={() => updateStatus('Need Cleaning')}
                  className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    unit.status === 'Need Cleaning'
                      ? 'bg-[#C8A96B] text-white border-[#C8A96B]'
                      : 'bg-muted/40 text-foreground border-border hover:bg-muted'
                  }`}
                >
                  Kotor
                </button>
              )}

              <button
                type="button"
                onClick={() => updateStatus('Maintenance')}
                className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  unit.status === 'Maintenance'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-muted/40 text-foreground border-border hover:bg-muted'
                }`}
              >
                Perbaikan
              </button>
            </div>
          </div>

          {/* TENANT DETAILS WIDGET (Matching SS 2 & SS 3 + Assign Tenant Action) */}
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
                      {property?.name || 'Kost Griya Melati'} • {unit.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAssignTenantOpen(true)}
                    className="px-3 py-1.5 rounded-xl border border-border bg-muted/30 hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1 transition-colors min-h-[36px]"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#8FA28A]" /> Edit Penyewa
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
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground dark:text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Informasi Penyewa Kamar
                  </h3>
                </div>
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

          {/* OWNER: Housekeeping Service Toggle (Layanan Kebersihan Kamar) - Placed below inventory & tenant info */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-4">
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
              Status saat ini di Info Kamar Tenant:{' '}
              <strong className={hasCleaningService ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {hasCleaningService ? '✓ Layanan Kebersihan Aktif' : '✗ Layanan Kebersihan Nonaktif'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Form Edit Modal */}
      {properties.length > 0 && isFormOpen && (
        <UnitFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleEditUnit}
          initialData={unit}
          properties={properties}
        />
      )}

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
