'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Building,
  Phone,
  MessageSquare,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  Home,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import HousekeepingTenantDetailModal, {
  HousekeepingTenantDetailItem,
} from './_components/HousekeepingTenantDetailModal';

export default function HousekeepingTenantsPage() {
  const [tenants, setTenants] = useState<HousekeepingTenantDetailItem[]>([]);
  const [assignedProperties, setAssignedProperties] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');

  // Detail Modal
  const [selectedTenant, setSelectedTenant] =
    useState<HousekeepingTenantDetailItem | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch Tenants Real-time from Database
  // ---------------------------------------------------------------------------
  const fetchTenants = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);
        const queryParams = new URLSearchParams();
        if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());
        if (selectedPropertyId && selectedPropertyId !== 'all') {
          queryParams.set('propertyId', selectedPropertyId);
        }

        const res = await fetch(
          `/api/housekeeping/tenants?${queryParams.toString()}`
        );

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || 'Gagal mengambil data penghuni');
        }

        const json = await res.json();
        if (json.data) {
          setTenants(json.data.tenants || []);
          if (Array.isArray(json.data.assignedProperties)) {
            setAssignedProperties(json.data.assignedProperties);
          }
        }
      } catch (err: any) {
        console.error('Error fetching housekeeping tenants:', err);
        setError(err.message || 'Terjadi kesalahan sistem saat mengambil data penghuni');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, selectedPropertyId]
  );

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Format IDR Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Format Date IDR
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Stats calculation
  const totalTenantsCount = tenants.length;
  const activeTenantsCount = tenants.filter(
    (t) => t.leaseStatus === 'ACTIVE'
  ).length;
  const propertiesCount = assignedProperties.length;

  return (
    <div className="space-y-6 pb-12">
      {/* --------------------------------------------------------------------- */}
      {/* PAGE HEADER & HERO BANNER */}
      {/* --------------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#242823] via-[#383E36] to-[#1C201C] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-[#8FA28A]/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#8FA28A]/20 px-3.5 py-1 text-xs font-bold text-[#8FA28A] border border-[#8FA28A]/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ARV-M2-06 • Modul Housekeeping Lapangan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Data Penghuni Lapangan
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Daftar kontak penghuni di unit kamar tugas Anda, verifikasi status huni realtime, Fast Check-In lapangan, dan komunikasi WhatsApp langsung.
            </p>
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={() => fetchTenants(true)}
            disabled={mounted ? (refreshing || loading) : undefined}
            className="self-start md:self-auto flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white border border-white/15 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>{refreshing ? 'Memperbarui...' : 'Refresh Realtime'}</span>
          </button>
        </div>

        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="rounded-2xl bg-white/5 backdrop-blur-xs p-3.5 border border-white/10 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Penghuni Aktif Lapangan
              </p>
              <p className="text-lg font-black text-white">{totalTenantsCount}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 backdrop-blur-xs p-3.5 border border-white/10 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C8A96B]/20 text-[#C8A96B]">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Properti Ditugaskan
              </p>
              <p className="text-lg font-black text-white">{propertiesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* CONTROLS: SEARCH & PROPERTY FILTER */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama penghuni, nomor kamar, HP..."
            className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2.5 text-xs font-semibold focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Property Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 shrink-0">
            <Filter className="h-4 w-4 text-[#8FA28A]" />
            <span>Properti:</span>
          </div>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full sm:w-60 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all"
          >
            <option value="all">Semua Properti Tugas ({assignedProperties.length})</option>
            {assignedProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TENANT CARDS GRID / REALTIME DATA LIST */}
      {/* --------------------------------------------------------------------- */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-gray-100 bg-white p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-2/3 rounded-lg bg-gray-200" />
                  <div className="h-3 w-1/3 rounded-lg bg-gray-200" />
                </div>
              </div>
              <div className="h-14 rounded-2xl bg-gray-100" />
              <div className="h-9 rounded-xl bg-gray-200" />
            </div>
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-gray-800">
            {searchQuery
              ? `Tidak ada penghuni dengan kata kunci "${searchQuery}"`
              : 'Belum Ada Data Penghuni'}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? 'Coba periksa kembali ejaan nama penghuni atau nomor kamar yang Anda cari.'
              : 'Belum ada penghuni aktif yang terdaftar di properti tugas Anda saat ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {tenants.map((tenant) => {
            const isLeaseActive = tenant.leaseStatus === 'ACTIVE';

            return (
              <div
                key={tenant.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-xs hover:shadow-xl hover:border-[#8FA28A]/40 transition-all duration-200"
              >
                <div className="space-y-4">
                  {/* Card Top: Avatar & Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8FA28A]/15 text-[#6B7F66] font-extrabold text-base shadow-2xs group-hover:bg-[#8FA28A] group-hover:text-white transition-colors">
                        {tenant.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#6B7F66] transition-colors line-clamp-1">
                          {tenant.fullName}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium line-clamp-1">
                          {tenant.occupation || 'Penghuni Kamar'}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isLeaseActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isLeaseActive ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      <span>{isLeaseActive ? 'AKTIF' : tenant.leaseStatus}</span>
                    </span>
                  </div>

                  {/* Room & Property Badge */}
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building className="h-4 w-4 text-[#8FA28A] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {tenant.propertyName}
                        </p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          Lantai {tenant.unitFloor} ({tenant.unitDimensions})
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 px-2.5 py-1 rounded-xl bg-[#8FA28A]/15 text-[#6B7F66] border border-[#8FA28A]/30 text-xs font-black font-mono">
                      Unit {tenant.unitNumber}
                    </div>
                  </div>

                  {/* Dates & Rent Info */}
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-medium">Masa Sewa:</span>
                      <span className="font-bold text-gray-800 font-mono text-[11px]">
                        {formatDate(tenant.startDate)} — {formatDate(tenant.endDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-medium">Tarif Sewa:</span>
                      <span className="font-bold text-emerald-700 font-mono text-[11px]">
                        {formatCurrency(tenant.rentPrice)} / {tenant.rentalPeriod === 'MONTHLY' ? 'Bulan' : tenant.rentalPeriod}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2">
                  {tenant.waLink ? (
                    <a
                      href={tenant.waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 shadow-md shadow-emerald-600/10 active:scale-98 transition-all"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span>Chat WA</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs py-2.5 px-3 cursor-not-allowed"
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>No HP N/A</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedTenant(tenant)}
                    className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 py-2.5 px-3 flex items-center gap-1 transition-all active:scale-98 cursor-pointer"
                    title="Lihat Detail Profil & Unit"
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span>Detail</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TENANT DETAIL MODAL */}
      {/* --------------------------------------------------------------------- */}
      <HousekeepingTenantDetailModal
        isOpen={!!selectedTenant}
        onClose={() => setSelectedTenant(null)}
        tenant={selectedTenant}
      />
    </div>
  );
}
