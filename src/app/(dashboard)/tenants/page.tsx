'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Users,
  UserCheck,
  Clock,
  UserX,
  Eye,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Building,
  ArrowRightLeft,
} from 'lucide-react';
import { Tenant, TenantStatus } from './_types';
import TenantFormModal from './_components/TenantFormModal';
import TenantDetailModal from './_components/TenantDetailModal';
import TransferUnitModal from './_components/TransferUnitModal';

// Mock Master Data for Initial Seed & Fallback
const INITIAL_MASTER_TENANTS: Tenant[] = [
  {
    id: 'tenant-101',
    fullName: 'Budi Santoso',
    nik: '3201011508920001',
    email: 'budi.santoso@gmail.com',
    phoneNumber: '08123456789',
    occupation: 'Software Engineer',
    status: 'AKTIF',
    currentPropertyId: 'prop-1',
    currentPropertyName: 'Kost Griya Melati',
    currentUnitId: 'unit-2',
    currentUnitName: 'Kamar 102',
    leaseStartDate: '2026-08-01',
    leaseEndDate: '2027-08-01',
    emergencyContact: {
      name: 'Bambang Santoso',
      phone: '081987654321',
      relation: 'Orang Tua',
    },
    notes: 'Penyewa disiplin, bayar sewa via transfer di awal bulan.',
    createdAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'tenant-102',
    fullName: 'Siti Aminah',
    nik: '3201024409950003',
    email: 'siti.aminah@yahoo.com',
    phoneNumber: '085712345678',
    occupation: 'Mahasiswa / Pelajar',
    status: 'AKTIF',
    currentPropertyId: 'prop-1',
    currentPropertyName: 'Kost Griya Melati',
    currentUnitId: 'unit-1',
    currentUnitName: 'Kamar 101',
    leaseStartDate: '2026-07-15',
    leaseEndDate: '2027-07-15',
    emergencyContact: {
      name: 'Dewi Aminah',
      phone: '085698765432',
      relation: 'Orang Tua',
    },
    notes: 'Mahasiswa UI jurusan Ekonomi.',
    createdAt: '2026-07-10T14:30:00.000Z',
  },
  {
    id: 'tenant-103',
    fullName: 'Rizky Ramadhan',
    nik: '3174031201980005',
    email: 'rizky.ramadhan@company.co.id',
    phoneNumber: '081399887766',
    occupation: 'Karyawan Swasta',
    status: 'CALON',
    currentPropertyName: 'Mencari Kost Suite',
    emergencyContact: {
      name: 'Andi Ramadhan',
      phone: '081211223344',
      relation: 'Saudara Kandung',
    },
    notes: 'Sudah bayar DP booking untuk rencana check-in bulan depan.',
    createdAt: '2026-08-18T09:15:00.000Z',
  },
  {
    id: 'tenant-104',
    fullName: 'Ahmad Fauzi',
    nik: '3273052003960002',
    email: 'ahmad.fauzi@outlook.com',
    phoneNumber: '082133445566',
    occupation: 'Wiraswasta / Freelance',
    status: 'NONAKTIF',
    currentPropertyId: 'prop-2',
    currentPropertyName: 'Apartemen Arventa Tower',
    currentUnitId: 'unit-3',
    currentUnitName: 'Suite Unit A',
    leaseStartDate: '2025-06-01',
    leaseEndDate: '2026-06-01',
    emergencyContact: {
      name: 'Hj. Syamsul',
      phone: '082199887766',
      relation: 'Orang Tua',
    },
    notes: 'Sudah checkout & refund deposit lengkap per Juni 2026.',
    createdAt: '2025-05-25T11:00:00.000Z',
  },
  {
    id: 'tenant-105',
    fullName: 'Clarissa Putri',
    nik: '3201086105000004',
    email: 'clarissa.p@gmail.com',
    phoneNumber: '081277665544',
    occupation: 'Profesional / Dokter / Pengacara',
    status: 'AKTIF',
    currentPropertyId: 'prop-2',
    currentPropertyName: 'Apartemen Arventa Tower',
    currentUnitId: 'unit-4',
    currentUnitName: 'Unit 205',
    leaseStartDate: '2026-03-01',
    leaseEndDate: '2027-03-01',
    emergencyContact: {
      name: 'Ir. Hendra',
      phone: '081122334455',
      relation: 'Orang Tua',
    },
    notes: 'Dokter spesialis di RS Jati Asih.',
    createdAt: '2026-02-20T08:00:00.000Z',
  },
  {
    id: 'tenant-106',
    fullName: 'Doni Prasetyo',
    nik: '3175021811930007',
    email: 'doni.prasetyo@tech.id',
    phoneNumber: '087811223344',
    occupation: 'Karyawan Swasta',
    status: 'CALON',
    notes: 'Menunggu konfirmasi ketersediaan kamar lantai 2.',
    createdAt: '2026-08-20T16:45:00.000Z',
  },
  {
    id: 'tenant-107',
    fullName: 'Eka Lestari',
    nik: '3204055207990009',
    email: 'eka.lestari@gmail.com',
    phoneNumber: '085644332211',
    occupation: 'Mahasiswa / Pelajar',
    status: 'NONAKTIF',
    notes: 'Selesai masa studi dan pindah ke luar kota.',
    createdAt: '2024-09-01T10:00:00.000Z',
  },
];

function mapApiTenantToFrontend(item: any): Tenant {
  const user = item.user || {};
  const activeLease = item.leases && item.leases.length > 0 ? item.leases[0] : null;

  let status: TenantStatus = 'CALON';
  if (activeLease) {
    status = 'AKTIF';
  } else if ((item.leases && item.leases.length > 0) || item._count?.leases > 0 || user.isActive === false) {
    status = 'NONAKTIF';
  }

  return {
    id: item.id || item.userId || `tenant-${Date.now()}`,
    fullName: user.fullName || item.fullName || 'Tanpa Nama',
    nik: item.nik || '',
    email: user.email || item.email || '',
    phoneNumber: user.phoneNumber || item.phoneNumber || '',
    occupation: item.occupation || 'Karyawan Swasta',
    emergencyContact: (item.emergencyName || item.emergencyPhone) ? {
      name: item.emergencyName || '',
      phone: item.emergencyPhone || '',
      relation: 'Kontak Darurat',
    } : undefined,
    status,
    currentPropertyId: activeLease?.unit?.property?.id,
    currentPropertyName: activeLease?.unit?.property?.name,
    currentUnitId: activeLease?.unit?.id,
    currentUnitName: activeLease?.unit?.unitNumber
      ? (/^(kamar|apt|unit)/i.test(activeLease.unit.unitNumber)
          ? activeLease.unit.unitNumber
          : `Kamar ${activeLease.unit.unitNumber}`)
      : undefined,
    leaseStartDate: activeLease?.startDate ? new Date(activeLease.startDate).toISOString().split('T')[0] : undefined,
    leaseEndDate: activeLease?.endDate ? new Date(activeLease.endDate).toISOString().split('T')[0] : undefined,
    avatarUrl: user.avatarUrl || undefined,
    ktpImageUrl: item.ktpImageUrl || undefined,
    createdAt: item.createdAt || user.createdAt || new Date().toISOString(),
  };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'ALL'>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantToEdit, setTenantToEdit] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [tenantToTransfer, setTenantToTransfer] = useState<Tenant | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants?limit=100');
      if (res.ok) {
        const json = await res.json();
        const apiData = json.data;
        if (Array.isArray(apiData) && apiData.length > 0) {
          const mapped = apiData.map(mapApiTenantToFrontend);
          setTenants(mapped);
          localStorage.setItem('arventa_master_tenants', JSON.stringify(mapped));
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend API fetch notice: using cached local storage data', err);
    }

    // Fallback to localStorage / initial seed
    const stored = localStorage.getItem('arventa_master_tenants');
    if (stored) {
      try {
        setTenants(JSON.parse(stored));
      } catch {
        setTenants(INITIAL_MASTER_TENANTS);
      }
    } else {
      setTenants(INITIAL_MASTER_TENANTS);
      localStorage.setItem('arventa_master_tenants', JSON.stringify(INITIAL_MASTER_TENANTS));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const saveTenantsLocally = (updated: Tenant[]) => {
    setTenants(updated);
    localStorage.setItem('arventa_master_tenants', JSON.stringify(updated));
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = tenants.length;
    const aktif = tenants.filter((t) => t.status === 'AKTIF').length;
    const calon = tenants.filter((t) => t.status === 'CALON').length;
    const nonaktif = tenants.filter((t) => t.status === 'NONAKTIF').length;
    return { total, aktif, calon, nonaktif };
  }, [tenants]);

  // Filter Logic
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        t.fullName.toLowerCase().includes(q) ||
        t.nik.toLowerCase().includes(q) ||
        t.phoneNumber.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.currentPropertyName && t.currentPropertyName.toLowerCase().includes(q)) ||
        (t.currentUnitName && t.currentUnitName.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  // Paginated Data
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage) || 1;
  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTenants.slice(start, start + itemsPerPage);
  }, [filteredTenants, currentPage, itemsPerPage]);

  // Actions
  const handleOpenAddModal = () => {
    setTenantToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (tenant: Tenant) => {
    setTenantToEdit(tenant);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDetailModalOpen(true);
  };

  const handleOpenTransferModal = (tenant: Tenant) => {
    setTenantToTransfer(tenant);
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = (
    tenantId: string,
    propertyName: string,
    unitName: string,
    startDate: string,
    notes?: string
  ) => {
    const updatedTenants = tenants.map((t) => {
      if (t.id === tenantId) {
        return {
          ...t,
          status: 'AKTIF' as TenantStatus,
          currentPropertyName: propertyName,
          currentUnitName: unitName,
          leaseStartDate: startDate,
          notes: notes ? `${t.notes ? t.notes + '\n' : ''}[Pindah Unit]: ${notes}` : t.notes,
        };
      }
      return t;
    });

    saveTenantsLocally(updatedTenants);

    if (selectedTenant && selectedTenant.id === tenantId) {
      setSelectedTenant({
        ...selectedTenant,
        status: 'AKTIF',
        currentPropertyName: propertyName,
        currentUnitName: unitName,
        leaseStartDate: startDate,
      });
    }
  };

  const handleSaveTenant = async (tenantData: Partial<Tenant>) => {
    if (tenantData.id) {
      // Edit existing via API
      try {
        const res = await fetch(`/api/tenants/${tenantData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: tenantData.fullName,
            email: tenantData.email,
            phoneNumber: tenantData.phoneNumber,
            nik: tenantData.nik,
            occupation: tenantData.occupation,
            emergencyName: tenantData.emergencyContact?.name,
            emergencyPhone: tenantData.emergencyContact?.phone,
          }),
        });

        if (res.ok) {
          await fetchTenants();
          return;
        }
      } catch (err) {
        console.warn('API update notice: updating local storage state', err);
      }

      // Local update
      const updated = tenants.map((t) =>
        t.id === tenantData.id ? { ...t, ...tenantData } as Tenant : t
      );
      saveTenantsLocally(updated);
    } else {
      // Create new via API
      try {
        const res = await fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: tenantData.fullName,
            email: tenantData.email,
            phoneNumber: tenantData.phoneNumber,
            nik: tenantData.nik,
            occupation: tenantData.occupation,
            emergencyName: tenantData.emergencyContact?.name,
            emergencyPhone: tenantData.emergencyContact?.phone,
          }),
        });

        if (res.ok) {
          await fetchTenants();
          return;
        }
      } catch (err) {
        console.warn('API create notice: saving into local storage state', err);
      }

      // Local create
      const newTenant: Tenant = {
        id: `tenant-${Date.now()}`,
        fullName: tenantData.fullName || '',
        nik: tenantData.nik || '',
        email: tenantData.email || '',
        phoneNumber: tenantData.phoneNumber || '',
        occupation: tenantData.occupation || 'Wiraswasta',
        status: tenantData.status || 'CALON',
        emergencyContact: tenantData.emergencyContact,
        currentPropertyName: tenantData.currentPropertyName,
        currentUnitName: tenantData.currentUnitName,
        notes: tenantData.notes,
        createdAt: new Date().toISOString(),
      };
      saveTenantsLocally([newTenant, ...tenants]);
    }
  };

  const handleDeleteTenant = async (id: string) => {
    try {
      const res = await fetch(`/api/tenants/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchTenants();
        setTenantToDelete(null);
        return;
      }
    } catch (err) {
      console.warn('API delete notice: deleting from local storage state', err);
    }

    // Local delete
    const updated = tenants.filter((t) => t.id !== id);
    saveTenantsLocally(updated);
    setTenantToDelete(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#F7F4ED]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Memuat Master Data Penyewa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Page Header & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-[#8FA28A]" />
            Master Data Penyewa & Kontrak
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola seluruh data calon penyewa, penyewa aktif, hingga penyewa nonaktif (alumni) dalam satu tempat.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#8FA28A] px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-[#7D9178] transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Tambah Penyewa Baru
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Master Penyewa */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Data Penyewa</p>
            <h3 className="text-2xl font-black text-gray-800 mt-1">{metrics.total}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Seluruh individu terdaftar</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8FA28A]/10 text-[#8FA28A]">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Penyewa Aktif */}
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Penyewa Aktif</p>
            <h3 className="text-2xl font-black text-emerald-800 mt-1">{metrics.aktif}</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5">Sedang menghuni unit</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Calon Penyewa */}
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Calon Penyewa</p>
            <h3 className="text-2xl font-black text-amber-800 mt-1">{metrics.calon}</h3>
            <p className="text-[11px] text-amber-600 mt-0.5">Prospek / Booking baru</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Nonaktif / Alumni */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nonaktif / Alumni</p>
            <h3 className="text-2xl font-black text-gray-700 mt-1">{metrics.nonaktif}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Sudah tidak menghuni</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
            <UserX className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama penyewa, NIK, No. HP, email, atau unit kamar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-xs focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
            >
              <option value="ALL">Semua Status Penyewa</option>
              <option value="AKTIF">Penyewa Aktif</option>
              <option value="CALON">Calon Penyewa</option>
              <option value="NONAKTIF">Nonaktif / Alumni</option>
            </select>
          </div>

          {/* Items per page */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <span>Tampilkan:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
            >
              <option value={5}>5 per hal</option>
              <option value={10}>10 per hal</option>
              <option value={20}>20 per hal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {filteredTenants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-xs space-y-3">
          <Users className="h-10 w-10 text-[#C8A96B] mx-auto" />
          <h3 className="text-sm font-bold text-gray-700">Data Penyewa Tidak Ditemukan</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Tidak ada data penyewa yang sesuai dengan kata kunci pencarian atau filter yang dipilih. Silakan coba filter lain atau tambah data penyewa baru.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#8FA28A] px-4 py-2 text-xs font-bold text-white hover:bg-[#7D9178] transition-all mt-2"
          >
            <Plus className="h-4 w-4" /> Tambah Penyewa
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Nama & Identitas</th>
                  <th className="px-6 py-4">Kontak</th>
                  <th className="px-6 py-4">Status Penyewa</th>
                  <th className="px-6 py-4">Penempatan Unit</th>
                  <th className="px-6 py-4">Terdaftar Pada</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {paginatedTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Nama & NIK */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8FA28A] text-white font-bold text-xs shadow-xs">
                          {getInitials(tenant.fullName)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{tenant.fullName}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            NIK: <span className="font-mono">{tenant.nik || '-'}</span>
                          </p>
                          <span className="inline-block mt-0.5 text-[10px] text-[#8FA28A] font-semibold bg-[#F7F4ED] px-2 py-0.5 rounded-md">
                            {tenant.occupation || 'Profesi -'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Kontak */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
                          <Phone className="h-3.5 w-3.5 text-[#8FA28A]" />
                          <span>{tenant.phoneNumber || '-'}</span>
                        </div>
                        {tenant.email && (
                          <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            <span>{tenant.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {tenant.status === 'AKTIF' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      )}
                      {tenant.status === 'CALON' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Calon Penyewa
                        </span>
                      )}
                      {tenant.status === 'NONAKTIF' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600 border border-gray-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          Nonaktif / Alumni
                        </span>
                      )}
                    </td>

                    {/* Penempatan Unit */}
                    <td className="px-6 py-4">
                      {tenant.currentUnitName ? (
                        <div>
                          <p className="font-bold text-gray-800 flex items-center gap-1">
                            <Building className="h-3.5 w-3.5 text-[#8FA28A]" />
                            {tenant.currentUnitName}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {tenant.currentPropertyName || 'Properti Kost'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Belum Ada Penempatan</span>
                      )}
                    </td>

                    {/* Terdaftar Pada */}
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(tenant.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Pindah Unit */}
                        <button
                          onClick={() => handleOpenTransferModal(tenant)}
                          title="Pindah / Atur Penempatan Unit"
                          className="rounded-xl p-2 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </button>

                        {/* Detail */}
                        <button
                          onClick={() => handleOpenDetailModal(tenant)}
                          title="Lihat Detail"
                          className="rounded-xl p-2 text-gray-500 hover:bg-[#8FA28A]/10 hover:text-[#8FA28A] transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditModal(tenant)}
                          title="Edit Data"
                          className="rounded-xl p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-all"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setTenantToDelete(tenant)}
                          title="Hapus Data"
                          className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 px-6 py-4 gap-3 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Menampilkan{' '}
              <span className="font-bold text-gray-800">
                {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredTenants.length)}
              </span>{' '}
              dari <span className="font-bold text-gray-800">{filteredTenants.length}</span> penyewa
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>

              <span className="text-xs font-bold text-gray-700 px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Add & Edit) */}
      <TenantFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveTenant}
        tenantToEdit={tenantToEdit}
        onOpenTransfer={handleOpenTransferModal}
      />

      {/* Detail Modal */}
      <TenantDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        tenant={selectedTenant}
        onEdit={handleOpenEditModal}
        onOpenTransfer={handleOpenTransferModal}
      />

      {/* Transfer / Pindah Unit Modal */}
      <TransferUnitModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        tenant={tenantToTransfer}
        onConfirmTransfer={handleConfirmTransfer}
      />

      {/* Delete Confirmation Modal */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-800">Hapus Data Penyewa?</h3>
              <p className="text-xs text-gray-500">
                Apakah Anda yakin ingin menghapus data master <span className="font-bold text-gray-800">{tenantToDelete.fullName}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setTenantToDelete(null)}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteTenant(tenantToDelete.id)}
                className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
