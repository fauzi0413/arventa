'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Sparkles,
  Building,
  KeyRound,
  Edit3,
  Power,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  HousekeepingMember,
  ActivityItem,
  PropertyOption,
} from './_types';
import HousekeepingFormModal from './_components/HousekeepingFormModal';
import ResetPasswordModal from './_components/ResetPasswordModal';
import HousekeepingDetailModal from './_components/HousekeepingDetailModal';
import ActivityTimeline from './_components/ActivityTimeline';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function HousekeepingTeamPage() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'team' | 'activity'>('team');

  // Housekeeping Team Data States
  const [staffList, setStaffList] = useState<HousekeepingMember[]>([]);
  const [propertiesList, setPropertiesList] = useState<PropertyOption[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  // Filter States for Team
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamPropertyFilter, setTeamPropertyFilter] = useState('all');
  const [teamStatusFilter, setTeamStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Activity Monitoring Data States
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Filter States for Activities
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('ALL');
  const [activityPropertyFilter, setActivityPropertyFilter] = useState<string>('all');
  const [activityDateRange, setActivityDateRange] = useState<string>('ALL');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');

  // Modals States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<HousekeepingMember | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetTargetStaff, setResetTargetStaff] = useState<HousekeepingMember | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTargetStaff, setDetailTargetStaff] = useState<HousekeepingMember | null>(null);
  const [statusConfirmStaff, setStatusConfirmStaff] = useState<HousekeepingMember | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Alert/Toast State
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // 1. Fetch Properties List for assignment dropdowns
  // ---------------------------------------------------------------------------
  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch('/api/properties?limit=50');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          const props: PropertyOption[] = json.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            address: p.address,
          }));
          setPropertiesList(props);
          return props;
        }
      }
    } catch (err) {
      console.warn('Properties fetch notice:', err);
    }
    return [];
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Fetch Housekeeping Team List
  // ---------------------------------------------------------------------------
  const fetchHousekeepingTeam = useCallback(async () => {
    setLoadingTeam(true);
    try {
      const queryParams = new URLSearchParams();
      if (teamPropertyFilter !== 'all') queryParams.append('propertyId', teamPropertyFilter);
      if (teamStatusFilter !== 'ALL') queryParams.append('status', teamStatusFilter);
      if (teamSearchQuery) queryParams.append('search', teamSearchQuery);

      const res = await fetch(`/api/operations/housekeeping?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setStaffList(json.data);
          setLoadingTeam(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching housekeeping team:', err);
    }

    // Default Fallback Mock Data if in offline demo
    setStaffList([
      {
        id: 'hk-1',
        fullName: 'Agus Prasetyo',
        email: 'agus.hk@arventa.id',
        phoneNumber: '081234567890',
        role: 'HOUSEKEEPING',
        isActive: true,
        createdAt: new Date().toISOString(),
        assignedProperties: [
          { id: 'prop-1', name: 'Kost Griya Melati', address: 'Jl. Diponegoro No. 45' },
        ],
        totalPropertiesCount: 1,
        totalStatusLogsCount: 12,
        totalExpensesCount: 4,
      },
      {
        id: 'hk-2',
        fullName: 'Bambang Sudiro',
        email: 'bambang.hk@arventa.id',
        phoneNumber: '081399887766',
        role: 'HOUSEKEEPING',
        isActive: true,
        createdAt: new Date().toISOString(),
        assignedProperties: [
          { id: 'prop-2', name: 'Signature Suite Apartemen', address: 'Jl. Jend. Sudirman Kav 21' },
          { id: 'prop-3', name: 'Ruko Permata Hijau', address: 'Jl. Soekarno Hatta' },
        ],
        totalPropertiesCount: 2,
        totalStatusLogsCount: 8,
        totalExpensesCount: 2,
      },
    ]);
    setLoadingTeam(false);
  }, [teamPropertyFilter, teamStatusFilter, teamSearchQuery]);

  // ---------------------------------------------------------------------------
  // 3. Fetch Activity Monitoring Logs
  // ---------------------------------------------------------------------------
  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const queryParams = new URLSearchParams();
      if (activityPropertyFilter !== 'all') queryParams.append('propertyId', activityPropertyFilter);
      if (activityTypeFilter !== 'ALL') queryParams.append('type', activityTypeFilter);
      if (activitySearchQuery) queryParams.append('search', activitySearchQuery);

      if (activityDateRange === 'TODAY') {
        const today = new Date().toISOString().split('T')[0];
        queryParams.append('startDate', today);
      } else if (activityDateRange === '7DAYS') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        queryParams.append('startDate', d.toISOString().split('T')[0]);
      } else if (activityDateRange === '30DAYS') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        queryParams.append('startDate', d.toISOString().split('T')[0]);
      }

      const res = await fetch(`/api/operations/activities?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setActivities(json.data);
          setLoadingActivities(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching activities:', err);
    }

    // Default Fallback Mock Data for Activity Monitoring
    setActivities([
      {
        id: 'act-1',
        type: 'ROOM_STATUS',
        typeLabel: 'Update Status Kamar',
        performerName: 'Agus Prasetyo',
        performerRole: 'HOUSEKEEPING',
        propertyName: 'Kost Griya Melati',
        unitNumber: 'Kamar 102',
        activity: 'Status kamar diubah dari CLEANING ke AVAILABLE',
        previousStatus: 'CLEANING',
        newStatus: 'AVAILABLE',
        notes: 'Pembersihan rutin selesai, sprei & perlengkapan telah diganti.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'act-2',
        type: 'EXPENSE',
        typeLabel: 'Pengeluaran Operasional',
        performerName: 'Agus Prasetyo',
        performerRole: 'HOUSEKEEPING',
        propertyName: 'Kost Griya Melati',
        unitNumber: 'Gedung',
        activity: 'Pencatatan pengeluaran: Pembelian Sabun Pembersih & Sapu Lantai (Rp 125.000)',
        amount: 125000,
        category: 'SUPPLIES',
        notes: 'Struk terlampir di nota fisik.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'act-3',
        type: 'CHECKIN_CHECKOUT',
        typeLabel: 'Check-In / Out',
        performerName: 'Sistem / Staff Operasional',
        performerRole: 'SYSTEM',
        propertyName: 'Kost Griya Melati',
        unitNumber: 'Kamar 104',
        activity: 'Check-out Penyewa Selesai Masa Sewa (Rizki Pratama)',
        notes: 'Kamar otomatis masuk ke antrean Butuh Pembersihan (CLEANING).',
        fromStatus: 'OCCUPIED',
        toStatus: 'CLEANING',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'act-4',
        type: 'ROOM_STATUS',
        typeLabel: 'Update Status Kamar',
        performerName: 'Bambang Sudiro',
        performerRole: 'HOUSEKEEPING',
        propertyName: 'Signature Suite Apartemen',
        unitNumber: 'Apt 12B-01',
        activity: 'Status kamar diubah dari OCCUPIED ke MAINTENANCE',
        previousStatus: 'OCCUPIED',
        newStatus: 'MAINTENANCE',
        notes: 'Perbaikan instalasi AC bocor pipa pembuangan.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    setLoadingActivities(false);
  }, [activityPropertyFilter, activityTypeFilter, activityDateRange, activitySearchQuery]);

  useEffect(() => {
    fetchProperties();
    fetchHousekeepingTeam();
  }, [fetchProperties, fetchHousekeepingTeam]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivities();
    }
  }, [activeTab, fetchActivities]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  const handleSaveStaff = async (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password?: string;
    propertyIds: string[];
    isActive: boolean;
  }) => {
    if (editingStaff) {
      // Update
      const res = await fetch(`/api/operations/housekeeping/${editingStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          propertyIds: data.propertyIds,
          isActive: data.isActive,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Gagal memperbarui staf');
      }

      showToast(`Data staf '${data.fullName}' berhasil diperbarui!`);
      await fetchHousekeepingTeam();
    } else {
      // Create
      const res = await fetch('/api/operations/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Gagal menambahkan staf');
      }

      showToast(`Staf housekeeping '${data.fullName}' berhasil ditambahkan!`);
      await fetchHousekeepingTeam();
    }
    setIsFormOpen(false);
    setEditingStaff(null);
  };

  const handleToggleStaffStatus = (staff: HousekeepingMember) => {
    setStatusConfirmStaff(staff);
  };

  const confirmToggleStaffStatus = async () => {
    if (!statusConfirmStaff) return;

    const nextStatus = !statusConfirmStaff.isActive;
    const actionName = nextStatus ? 'mengaktifkan' : 'menonaktifkan';

    try {
      setIsTogglingStatus(true);
      const res = await fetch(`/api/operations/housekeeping/${statusConfirmStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (res.ok) {
        showToast(
          `Akun '${statusConfirmStaff.fullName}' berhasil ${
            nextStatus ? 'diaktifkan' : 'dinonaktifkan'
          }!`
        );
        await fetchHousekeepingTeam();
      } else {
        showToast(`Gagal ${actionName} staf`, 'error');
      }
    } catch (err) {
      showToast(`Gagal ${actionName} staf`, 'error');
    } finally {
      setIsTogglingStatus(false);
      setStatusConfirmStaff(null);
    }
  };

  const handleResetPassword = async (staffId: string, newPass: string) => {
    const res = await fetch(`/api/operations/housekeeping/${staffId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPass }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Gagal mereset password');
    }
    showToast('Password staf berhasil di-reset!');
  };

  // KPI Calculations
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter((s) => s.isActive).length;
  const coveredPropertiesSet = new Set(
    staffList.flatMap((s) => s.assignedProperties?.map((p) => p.id) || [])
  );
  const coveredPropertiesCount = coveredPropertiesSet.size;

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold shadow-xl border animate-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-700'
              : 'bg-red-800 text-white border-red-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-300" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#C7D3C0]/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#8FA28A]/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#8FA28A]">
              Owner Workspace
            </span>
            <span className="text-[10px] font-bold text-gray-400">•</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Sprint M4
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2 mt-1">
            <Users className="h-6 w-6 text-[#8FA28A]" />
            Tim Operasional & Housekeeping
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Kelola staf kebersihan, penugasan properti, reset password, dan audit trail aktivitas harian.
          </p>
        </div>

        {/* Action Button & Tab Switcher */}
        <div className="flex items-center gap-2">
          {activeTab === 'team' && (
            <button
              onClick={() => {
                setEditingStaff(null);
                setIsFormOpen(true);
              }}
              className="min-h-[40px] flex items-center gap-2 rounded-xl bg-[#8FA28A] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#7D9178] transition-all"
            >
              <UserPlus className="h-4 w-4" />
              <span>Tambah Housekeeping</span>
            </button>
          )}

          {activeTab === 'activity' && (
            <button
              onClick={fetchActivities}
              disabled={loadingActivities}
              className="min-h-[40px] flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#8FA28A] ${loadingActivities ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Total Staf
            </span>
            <Users className="h-4 w-4 text-[#8FA28A]" />
          </div>
          <p className="text-2xl font-black text-gray-800">{totalStaffCount}</p>
          <p className="text-[10px] text-gray-400">Akun terdaftar dalam sistem</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Staf Aktif
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{activeStaffCount}</p>
          <p className="text-[10px] text-gray-400">Siap menerima penugasan kamar</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Cakupan Properti
            </span>
            <Building className="h-4 w-4 text-[#C8A96B]" />
          </div>
          <p className="text-2xl font-black text-[#C8A96B]">{coveredPropertiesCount}</p>
          <p className="text-[10px] text-gray-400">Properti dengan staf terpasang</p>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Aktivitas Tercatat
            </span>
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700">{activities.length}</p>
          <p className="text-[10px] text-gray-400">Log operasional & kebersihan</p>
        </div>
      </div>

      {/* Tabs Switcher Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'team'
              ? 'border-[#8FA28A] text-[#8FA28A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Daftar Tim Housekeeping</span>
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-extrabold text-gray-700">
            {staffList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'activity'
              ? 'border-[#8FA28A] text-[#8FA28A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Monitoring Aktivitas (Audit Trail)</span>
          <span className="rounded-full bg-[#8FA28A]/20 px-2 py-0.5 text-[10px] font-extrabold text-[#8FA28A]">
            Auto-Log
          </span>
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: DAFTAR TIM HOUSEKEEPING (ARV-M4-01) */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs md:flex-row md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama staf, email, atau nomor HP..."
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-xs focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {/* Filter Properti */}
            <div className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={teamPropertyFilter}
                onChange={(e) => setTeamPropertyFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
              >
                <option value="all">Semua Properti</option>
                {propertiesList.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={teamStatusFilter}
                onChange={(e) => setTeamStatusFilter(e.target.value as any)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Housekeeping Cards Grid */}
          {loadingTeam ? (
            <div className="flex h-60 items-center justify-center">
              <div className="text-center space-y-2">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#8FA28A] border-t-transparent mx-auto" />
                <p className="text-xs text-gray-500 font-medium">Memuat tim housekeeping...</p>
              </div>
            </div>
          ) : staffList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-2xs space-y-3">
              <Users className="h-10 w-10 text-[#8FA28A] mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-gray-700">Belum Ada Staf Housekeeping</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Tambahkan staf housekeeping untuk mengelola kebersihan, update status kamar, dan monitoring pengeluaran operasional.
              </p>
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setIsFormOpen(true);
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#8FA28A] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#7D9178] transition-all"
              >
                <UserPlus className="h-4 w-4" />
                <span>Tambah Staf Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList.map((staff) => (
                <div
                  key={staff.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Card Header & Avatar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#8FA28A] to-[#C8A96B] p-0.5 shadow-xs shrink-0">
                        <div className="h-full w-full bg-white rounded-[14px] flex items-center justify-center font-black text-sm text-[#8FA28A]">
                          {staff.fullName.charAt(0)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-800 truncate">
                          {staff.fullName}
                        </h3>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {staff.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border shrink-0 ${
                        staff.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {staff.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  {/* Phone & Assigned Properties */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <Phone className="h-3.5 w-3.5 text-[#8FA28A] shrink-0" />
                      <span className="font-semibold">{staff.phoneNumber || '-'}</span>
                    </div>

                    {/* Assigned Properties Pill List */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Properti Ditugaskan ({staff.assignedProperties?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                        {staff.assignedProperties && staff.assignedProperties.length > 0 ? (
                          staff.assignedProperties.map((p) => (
                            <span
                              key={p.id}
                              className="text-[10px] font-bold bg-[#8FA28A]/10 text-[#8FA28A] px-2 py-0.5 rounded-md border border-[#8FA28A]/20 truncate max-w-[200px]"
                            >
                              {p.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">
                            Belum ada penugasan properti
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setDetailTargetStaff(staff);
                        setIsDetailOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-[11px] font-bold text-gray-700 transition-colors"
                      title="Lihat Detail Profil"
                    >
                      Detail
                    </button>

                    <button
                      onClick={() => {
                        setEditingStaff(staff);
                        setIsFormOpen(true);
                      }}
                      className="py-1.5 px-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-[11px] font-bold text-gray-700 transition-colors"
                      title="Edit Data"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-[#8FA28A]" />
                    </button>

                    <button
                      onClick={() => {
                        setResetTargetStaff(staff);
                        setIsResetPasswordOpen(true);
                      }}
                      className="py-1.5 px-2.5 rounded-xl border border-[#C8A96B]/40 bg-[#C8A96B]/10 hover:bg-[#C8A96B]/20 text-[11px] font-bold text-[#C8A96B] transition-colors"
                      title="Reset Password"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleStaffStatus(staff)}
                      className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-bold transition-colors ${
                        staff.isActive
                          ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-600'
                          : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                      title={staff.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: MONITORING AKTIVITAS (ARV-M4-03) */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {/* Filter Bar for Activity Logs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari aktivitas / nama staf..."
                value={activitySearchQuery}
                onChange={(e) => setActivitySearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-xs focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {/* Filter Property */}
            <div>
              <select
                value={activityPropertyFilter}
                onChange={(e) => setActivityPropertyFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
              >
                <option value="all">Semua Properti</option>
                {propertiesList.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Activity Type */}
            <div>
              <select
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
              >
                <option value="ALL">Semua Jenis Aktivitas</option>
                <option value="ROOM_STATUS">Update Status Kamar</option>
                <option value="EXPENSE">Pengeluaran Operasional</option>
                <option value="CHECKIN_CHECKOUT">Check-In / Out</option>
              </select>
            </div>

            {/* Filter Date Range */}
            <div>
              <select
                value={activityDateRange}
                onChange={(e) => setActivityDateRange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
              >
                <option value="ALL">Semua Waktu</option>
                <option value="TODAY">Hari Ini</option>
                <option value="7DAYS">7 Hari Terakhir</option>
                <option value="30DAYS">30 Hari Terakhir</option>
              </select>
            </div>
          </div>

          {/* Activity Timeline Feed */}
          <ActivityTimeline activities={activities} loading={loadingActivities} />
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODALS */}
      {/* --------------------------------------------------------------------- */}
      {/* Add / Edit Modal */}
      <HousekeepingFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingStaff(null);
        }}
        onSubmit={handleSaveStaff}
        staffToEdit={editingStaff}
        propertiesList={propertiesList}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => {
          setIsResetPasswordOpen(false);
          setResetTargetStaff(null);
        }}
        staff={resetTargetStaff}
        onResetPassword={handleResetPassword}
      />

      {/* Detail Profile Modal */}
      <HousekeepingDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailTargetStaff(null);
        }}
        staff={detailTargetStaff}
        onEdit={(staff) => {
          setEditingStaff(staff);
          setIsFormOpen(true);
        }}
        onResetPassword={(staff) => {
          setResetTargetStaff(staff);
          setIsResetPasswordOpen(true);
        }}
      />

      {/* Confirm Toggle Status Modal */}
      <ConfirmModal
        isOpen={!!statusConfirmStaff}
        onClose={() => setStatusConfirmStaff(null)}
        onConfirm={confirmToggleStaffStatus}
        isLoading={isTogglingStatus}
        title={
          statusConfirmStaff?.isActive
            ? 'Nonaktifkan Akun Staf?'
            : 'Aktifkan Akun Staf?'
        }
        description={
          <>
            Apakah Anda yakin ingin{' '}
            <strong className="text-gray-900 font-bold">
              {statusConfirmStaff?.isActive ? 'menonaktifkan' : 'mengaktifkan'}
            </strong>{' '}
            akses akun staf ini? Staf dapat login kembali setelah akun diaktifkan.
          </>
        }
        targetName={
          statusConfirmStaff
            ? `${statusConfirmStaff.fullName} • ${statusConfirmStaff.email}`
            : undefined
        }
        confirmText={
          statusConfirmStaff?.isActive ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'
        }
        cancelText="Batal"
        variant={statusConfirmStaff?.isActive ? 'warning' : 'info'}
      />
    </div>
  );
}
