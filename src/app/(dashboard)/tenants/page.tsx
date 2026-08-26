'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Tenant, TenantStatus, TenantHistoryRecord, HistoryEventType } from './_types';
import TenantFormModal from './_components/TenantFormModal';
import TenantDetailModal from './_components/TenantDetailModal';
import TransferUnitModal from './_components/TransferUnitModal';
import ContractPreviewModal from '../tenant-contract/_components/ContractPreviewModal';
import { ContractItem } from '../tenant-contract/_types';

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
    history: [
      {
        id: 'h-101-1',
        type: 'TRANSFER_UNIT',
        title: 'Penempatan Unit: Kost Griya Melati — Kamar 102',
        description: 'Penempatan awal penyewa disetujui di Kamar 102.',
        propertyName: 'Kost Griya Melati',
        unitName: 'Kamar 102',
        timestamp: '2026-08-01T10:00:00.000Z',
      },
      {
        id: 'h-101-0',
        type: 'STATUS_CHANGE',
        title: 'Perubahan Status: Calon Penyewa ➔ Penyewa Aktif',
        description: 'Status disetujui menjadi Penyewa Aktif.',
        fromStatus: 'CALON',
        toStatus: 'AKTIF',
        timestamp: '2026-08-01T09:30:00.000Z',
      },
    ],
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
    history: [
      {
        id: 'h-102-1',
        type: 'TRANSFER_UNIT',
        title: 'Penempatan Unit: Kost Griya Melati — Kamar 101',
        description: 'Penempatan aktif di Kamar 101.',
        propertyName: 'Kost Griya Melati',
        unitName: 'Kamar 101',
        timestamp: '2026-07-15T08:00:00.000Z',
      },
    ],
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
    history: [
      {
        id: 'h-104-2',
        type: 'STATUS_CHANGE',
        title: 'Perubahan Status: Penyewa Aktif ➔ Nonaktif / Alumni',
        description: 'Masa sewa berakhir dan checkout per Juni 2026.',
        fromStatus: 'AKTIF',
        toStatus: 'NONAKTIF',
        timestamp: '2026-06-01T12:00:00.000Z',
      },
      {
        id: 'h-104-1',
        type: 'TRANSFER_UNIT',
        title: 'Penempatan Unit: Apartemen Arventa Tower — Suite Unit A',
        description: 'Mulai penempatan di Suite Unit A.',
        propertyName: 'Apartemen Arventa Tower',
        unitName: 'Suite Unit A',
        timestamp: '2025-06-01T10:00:00.000Z',
      },
    ],
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
    history: [
      {
        id: 'h-107-1',
        type: 'STATUS_CHANGE',
        title: 'Perubahan Status: Penyewa Aktif ➔ Nonaktif / Alumni',
        description: 'Penyewa menyelesaikan studi dan mengakhiri kontrak.',
        fromStatus: 'AKTIF',
        toStatus: 'NONAKTIF',
        timestamp: '2025-08-31T17:00:00.000Z',
      },
    ],
  },
];

function mapApiTenantToFrontend(item: any): Tenant {
  const user = item.user || {};
  const leases = Array.isArray(item.leases) ? item.leases : [];
  const activeLease = leases.find((l: any) => l.status === 'ACTIVE');
  const targetLease = activeLease || (leases.length > 0 ? leases[0] : null);

  const currentUnitId = targetLease?.unit?.id || targetLease?.unitId || item.currentUnitId;
  const leaseStatus = targetLease?.status;

  let status: TenantStatus = 'CALON';
  if (!currentUnitId) {
    // Rule 1: Jika terdaftar tapi unit_id belum ada -> Penyewa ('CALON')
    status = 'CALON';
  } else if (leaseStatus === 'ACTIVE' || activeLease || item.status === 'AKTIF') {
    // Rule 2: Jika status active dan sudah memiliki unit_id -> Aktif ('AKTIF')
    status = 'AKTIF';
  } else if (leaseStatus === 'TERMINATED' || user.isActive === false || item.status === 'NONAKTIF') {
    // Rule 3: Jika status terminated dan memiliki unit_id -> Nonaktif ('NONAKTIF')
    status = 'NONAKTIF';
  } else {
    status = item.status || 'CALON';
  }

  // Fetch tenant movement history strictly and solely from log_leases table
  const dbLogs = Array.isArray(item.leaseLogs) ? item.leaseLogs : [];
  const historyFromLogLeases: TenantHistoryRecord[] = dbLogs.map((log: any, idx: number) => ({
    id: log.id || `log-${idx}`,
    type: (log.actionType as HistoryEventType) || 'STATUS_CHANGE',
    title: log.title || 'Catatan Riwayat',
    description: log.description || undefined,
    propertyName: log.propertyName || undefined,
    unitName: log.unitName || undefined,
    fromStatus: log.fromStatus || undefined,
    toStatus: log.toStatus || undefined,
    timestamp: log.createdAt || new Date().toISOString(),
  }));

  return {
    id: item.id || item.userId || `tenant-${Date.now()}`,
    fullName: item.fullName || user.fullName || 'Tanpa Nama',
    nik: item.nik || '',
    email: item.email || user.email || '',
    phoneNumber: item.phoneNumber || user.phoneNumber || '',
    occupation: item.occupation || 'Karyawan Swasta',
    emergencyContact: (item.emergencyName || item.emergencyPhone || item.emergencyRelation) ? {
      name: item.emergencyName || '',
      phone: item.emergencyPhone || '',
      relation: item.emergencyRelation || 'Kontak Darurat',
    } : undefined,
    status,
    currentPropertyId: targetLease?.unit?.property?.id,
    currentPropertyName: targetLease?.unit?.property?.name,
    currentUnitId: targetLease?.unit?.id,
    currentUnitName: targetLease?.unit?.unitNumber
      ? (/^(kamar|apt|unit)/i.test(targetLease.unit.unitNumber)
        ? targetLease.unit.unitNumber
        : `Kamar ${targetLease.unit.unitNumber}`)
      : undefined,
    leaseStartDate: targetLease?.startDate ? new Date(targetLease.startDate).toISOString().split('T')[0] : undefined,
    leaseEndDate: targetLease?.endDate ? new Date(targetLease.endDate).toISOString().split('T')[0] : undefined,
    history: historyFromLogLeases,
    avatarUrl: user.avatarUrl || undefined,
    ktpImageUrl: item.ktpImageUrl || undefined,
    birthPlaceDate: item.birthPlaceDate || undefined,
    gender: item.gender || undefined,
    bloodType: item.bloodType || undefined,
    addressKtp: item.addressKtp || undefined,
    rtRw: item.rtRw || undefined,
    kelDesa: item.kelDesa || undefined,
    kecamatan: item.kecamatan || undefined,
    religion: item.religion || undefined,
    maritalStatus: item.maritalStatus || undefined,
    nationality: item.nationality || undefined,
    validUntil: item.validUntil || undefined,
    createdAt: item.createdAt || user.createdAt || new Date().toISOString(),
  };
}

function TenantsPageContent() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'ALL'>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPreviewContractOpen, setIsPreviewContractOpen] = useState(false);
  const [selectedContractForPreview, setSelectedContractForPreview] = useState<ContractItem | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantToEdit, setTenantToEdit] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [tenantToTransfer, setTenantToTransfer] = useState<Tenant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleViewContract = async (tenant: Tenant) => {
    try {
      const res = await fetch(`/api/contracts`);
      if (res.ok) {
        const json = await res.json();
        const rawList = json.data || json || [];
        const match = rawList.find(
          (c: any) =>
            c.tenantId === tenant.id ||
            c.tenant?.id === tenant.id ||
            c.tenant?.userId === tenant.id ||
            c.tenant?.fullName?.toLowerCase() === tenant.fullName?.toLowerCase() ||
            c.tenant?.user?.fullName?.toLowerCase() === tenant.fullName?.toLowerCase()
        );

        if (match) {
          const formatted: ContractItem = {
            id: match.id,
            contractNumber: match.contractNumber || `KTR/ARV/${match.id.slice(-6).toUpperCase()}`,
            scope: match.scope || (match.unitId ? 'UNIT' : 'PROPERTY'),
            status: match.status || 'ACTIVE',
            tenantId: match.tenantId || tenant.id,
            tenantName: match.tenant?.fullName || match.tenant?.user?.fullName || tenant.fullName,
            tenantPhone: match.tenant?.phoneNumber || match.tenant?.user?.phoneNumber || tenant.phoneNumber || '',
            tenantEmail: match.tenant?.email || match.tenant?.user?.email || tenant.email || '',
            tenantNik: match.tenant?.nik || tenant.nik || '',
            propertyId: match.unit?.property?.id || match.unit?.propertyId || tenant.currentPropertyId || '',
            propertyName: match.unit?.property?.name || tenant.currentPropertyName || 'Kos Graha Asri',
            propertyAddress: match.unit?.property?.address || 'Sesuai Data Properti',
            ownerName: match.unit?.property?.owner?.fullName || 'Budi Santoso',
            ownerPhone: match.unit?.property?.owner?.phoneNumber || '081234567890',
            ownerEmail: match.unit?.property?.owner?.email || 'budi@kostsejahtera.com',
            unitId: match.unitId || tenant.currentUnitId,
            unitName: match.unit?.unitNumber || tenant.currentUnitName || 'Unit Kamar',
            rentalPeriod: match.rentalPeriod || 'MONTHLY',
            startDate: match.startDate || tenant.leaseStartDate || new Date().toISOString().split('T')[0],
            endDate: match.endDate || tenant.leaseEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            rentPrice: match.rentPrice ?? 1500000,
            securityDeposit: match.securityDeposit ?? 500000,
            createdAt: match.createdAt || tenant.createdAt,
            notes: match.notes || '',
            customClauses: match.customClauses && match.customClauses.length > 0 ? match.customClauses : [
              'Pembayaran sewa dilakukan tepat waktu di awal periode sewa.',
              'Penyewa wajib menjaga kebersihan dan ketertiban lingkungan properti.',
              'Uang jaminan (deposit) akan dikembalikan penuh saat check-out jika tidak ada kerusakan unit.',
            ],
          };

          setSelectedContractForPreview(formatted);
          setIsPreviewContractOpen(true);
          return;
        }
      }
    } catch (e) {
      console.error('Error fetching tenant contract:', e);
    }

    // Fallback contract if match is not found in database
    const fallbackContract: ContractItem = {
      id: `contract-${tenant.id}`,
      contractNumber: `KTR/ARV/${tenant.id.slice(-6).toUpperCase()}`,
      scope: 'UNIT',
      status: tenant.status === 'AKTIF' ? 'ACTIVE' : tenant.status === 'CALON' ? 'DRAFT' : 'TERMINATED',
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      tenantPhone: tenant.phoneNumber || '',
      tenantEmail: tenant.email || '',
      tenantNik: tenant.nik || '',
      propertyId: tenant.currentPropertyId || '',
      propertyName: tenant.currentPropertyName || 'Kos Graha Asri',
      propertyAddress: 'Sesuai Data Properti',
      ownerName: 'Budi Santoso',
      ownerPhone: '081234567890',
      ownerEmail: 'budi@kostsejahtera.com',
      unitId: tenant.currentUnitId,
      unitName: tenant.currentUnitName || 'Unit Kamar',
      rentalPeriod: 'MONTHLY',
      startDate: tenant.leaseStartDate || new Date().toISOString().split('T')[0],
      endDate: tenant.leaseEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rentPrice: 1500000,
      securityDeposit: 500000,
      createdAt: tenant.createdAt,
      customClauses: [
        'Pembayaran sewa dilakukan tepat waktu di awal periode sewa.',
        'Penyewa wajib menjaga kebersihan dan ketertiban lingkungan properti.',
        'Uang jaminan (deposit) akan dikembalikan penuh saat check-out jika tidak ada kerusakan unit.',
      ],
    };

    setSelectedContractForPreview(fallbackContract);
    setIsPreviewContractOpen(true);
  };

  // Modern Toast Alert Notification State
  const [toastNotification, setToastNotification] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'info' | 'warning';
  } | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastNotification({ title, message, type });
    setTimeout(() => {
      setToastNotification((curr) => (curr?.title === title ? null : curr));
    }, 4500);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants?limit=100');
      if (res.ok) {
        const json = await res.json();
        const apiData = json.data;
        if (Array.isArray(apiData)) {
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

    // Fallback to localStorage / initial seed only if network error
    const stored = localStorage.getItem('arventa_master_tenants');
    if (stored) {
      try {
        setTenants(JSON.parse(stored));
      } catch {
        setTenants([]);
      }
    } else {
      setTenants([]);
    }
    setLoading(false);
  };

  const searchParams = useSearchParams();
  const editTenantId = searchParams ? (searchParams.get('editTenantId') || searchParams.get('editForTenantId')) : null;

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (editTenantId && tenants.length > 0) {
      const targetParam = decodeURIComponent(editTenantId);
      const match = tenants.find(
        (t) =>
          t.id === targetParam ||
          t.id.includes(targetParam) ||
          t.fullName.toLowerCase().includes(targetParam.toLowerCase()) ||
          (t as any).userId === targetParam
      );
      if (match) {
        setTenantToEdit(match);
        setIsFormModalOpen(true);
      }
    }
  }, [editTenantId, tenants]);

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

  // Filter & Sort Logic: Calon Penyewa -> Aktif -> Nonaktif / Alumni
  const filteredTenants = useMemo(() => {
    const statusPriority: Record<string, number> = {
      CALON: 1,
      AKTIF: 2,
      NONAKTIF: 3,
    };

    return tenants
      .filter((t) => {
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
      })
      .sort((a, b) => {
        const prioA = statusPriority[a.status] || 99;
        const prioB = statusPriority[b.status] || 99;
        if (prioA !== prioB) return prioA - prioB;
        return 0;
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

  const handleConfirmTransfer = async (
    tenantId: string,
    propertyName: string,
    unitName: string,
    startDate: string,
    notes?: string
  ) => {
    const targetTenant = tenants.find((t) => t.id === tenantId);

    // API call to persist unit transfer to database
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'AKTIF',
          propertyName,
          unitName,
          leaseStartDate: startDate,
          notes: notes ? `[Pindah Unit]: ${notes}` : undefined,
        }),
      });

      if (res.ok) {
        await fetchTenants();
        showToast('Penempatan Unit Berhasil!', `Penyewa ${targetTenant?.fullName || ''} berhasil dipindahkan ke ${propertyName} — ${unitName}.`);
        return;
      }
    } catch (err) {
      console.warn('API transfer update warning: fallback to local storage', err);
    }

    // Local fallback update
    let updatedTargetTenant: Tenant | null = null;
    const updatedTenants = tenants.map((t) => {
      if (t.id === tenantId) {
        const oldUnit = t.currentUnitName;
        const isFirstPlacement = !oldUnit;
        const newHist: TenantHistoryRecord = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: isFirstPlacement ? 'INITIAL_PLACEMENT' : 'TRANSFER_UNIT',
          title: isFirstPlacement
            ? `Penempatan Unit: ${propertyName} — ${unitName}`
            : `Pindah Unit: ${oldUnit} ➔ ${unitName}`,
          description: isFirstPlacement
            ? `Penyewa pertama kali ditempatkan di ${propertyName} — ${unitName}.${notes ? ` Catatan: ${notes}` : ''}`
            : `Dipindahkan dari ${oldUnit} ke ${propertyName} — ${unitName}.${notes ? ` Catatan: ${notes}` : ''}`,
          propertyName,
          unitName,
          timestamp: new Date().toISOString(),
        };

        const updated = {
          ...t,
          status: 'AKTIF' as TenantStatus,
          currentPropertyName: propertyName,
          currentUnitName: unitName,
          leaseStartDate: startDate,
          history: [newHist, ...(t.history || [])],
          notes: notes ? `${t.notes ? t.notes + '\n' : ''}[Pindah Unit]: ${notes}` : t.notes,
        };
        updatedTargetTenant = updated;
        return updated;
      }
      return t;
    });

    saveTenantsLocally(updatedTenants);

    if (selectedTenant && selectedTenant.id === tenantId && updatedTargetTenant) {
      setSelectedTenant(updatedTargetTenant);
    }

    // Sync unit occupancy in localStorage
    try {
      const storedUnits = localStorage.getItem('arventa_units');
      if (storedUnits) {
        const unitsList = JSON.parse(storedUnits);
        const updatedUnits = unitsList.map((u: any) => {
          if (u.name === unitName || u.unitNumber === unitName) {
            return {
              ...u,
              status: 'Occupied',
              tenantName: targetTenant?.fullName || 'Penyewa',
              checkInDate: startDate,
            };
          }
          return u;
        });
        localStorage.setItem('arventa_units', JSON.stringify(updatedUnits));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (e) {
      console.warn('Failed to update local unit occupancy:', e);
    }
    showToast('Penempatan Unit Berhasil!', `Penyewa ${targetTenant?.fullName || ''} berhasil dipindahkan ke ${propertyName} — ${unitName}.`);
  };

  const handleSaveTenant = async (tenantData: Partial<Tenant>) => {
    const payload = {
      fullName: tenantData.fullName,
      email: tenantData.email,
      phoneNumber: tenantData.phoneNumber,
      nik: tenantData.nik,
      occupation: tenantData.occupation,
      status: tenantData.status,
      unitName: tenantData.currentUnitName,
      propertyName: tenantData.currentPropertyName,
      leaseStartDate: tenantData.leaseStartDate,
      ktpImageUrl: tenantData.ktpImageUrl,
      birthPlaceDate: tenantData.birthPlaceDate,
      gender: tenantData.gender,
      bloodType: tenantData.bloodType,
      addressKtp: tenantData.addressKtp,
      rtRw: tenantData.rtRw,
      kelDesa: tenantData.kelDesa,
      kecamatan: tenantData.kecamatan,
      religion: tenantData.religion,
      maritalStatus: tenantData.maritalStatus,
      nationality: tenantData.nationality,
      validUntil: tenantData.validUntil,
      emergencyName: tenantData.emergencyContact?.name,
      emergencyPhone: tenantData.emergencyContact?.phone,
      emergencyRelation: tenantData.emergencyContact?.relation,
    };

    if (tenantData.id) {
      // Edit existing via API
      try {
        const res = await fetch(`/api/tenants/${tenantData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await fetchTenants();
          showToast('Data Penyewa Diperbarui', `Profil data penyewa ${tenantData.fullName || ''} berhasil diperbarui di database.`);
          return;
        }
      } catch (err) {
        console.warn('API update notice: updating local storage state', err);
      }

      // Local update
      let updatedEditedTenant: Tenant | null = null;
      const updated = tenants.map((t) => {
        if (t.id === tenantData.id) {
          const newStatus = tenantData.status || t.status;
          const newHistory: TenantHistoryRecord[] = [...(t.history || [])];

          const statusLabels: Record<string, string> = {
            AKTIF: 'Penyewa Aktif',
            CALON: 'Calon Penyewa',
            NONAKTIF: 'Nonaktif / Alumni',
          };

          if (t.status !== newStatus) {
            if (newStatus === 'NONAKTIF') {
              newHistory.unshift({
                id: `hist-deactive-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                type: 'DEACTIVATED',
                title: 'Status Berubah: Nonaktif / Alumni',
                description: t.currentUnitName
                  ? `Penyewa telah dinonaktifkan (checkout/alumni). Unit ${t.currentPropertyName || ''} — ${t.currentUnitName} telah dikosongkan kembali.`
                  : 'Status penyewa diperbarui menjadi Nonaktif / Alumni.',
                fromStatus: t.status,
                toStatus: 'NONAKTIF',
                timestamp: new Date().toISOString(),
              });
            } else {
              newHistory.unshift({
                id: `hist-status-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                type: 'STATUS_CHANGE',
                title: `Perubahan Status: ${statusLabels[t.status] || t.status} ➔ ${statusLabels[newStatus] || newStatus}`,
                description: newStatus === 'AKTIF' && tenantData.currentUnitName
                  ? `Status berubah menjadi Penyewa Aktif di ${tenantData.currentPropertyName || ''} — ${tenantData.currentUnitName}`
                  : `Status penyewa diperbarui dari ${statusLabels[t.status] || t.status} menjadi ${statusLabels[newStatus] || newStatus}`,
                fromStatus: t.status,
                toStatus: newStatus,
                timestamp: new Date().toISOString(),
              });
            }
          }

          if (tenantData.currentUnitName && t.currentUnitName !== tenantData.currentUnitName) {
            const isInitialPlacement = !t.currentUnitName;
            newHistory.unshift({
              id: `hist-unit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              type: isInitialPlacement ? 'INITIAL_PLACEMENT' : 'TRANSFER_UNIT',
              title: isInitialPlacement
                ? `Penempatan Unit: ${tenantData.currentPropertyName || ''} — ${tenantData.currentUnitName}`
                : `Pindah Unit: ${t.currentUnitName} ➔ ${tenantData.currentUnitName}`,
              description: isInitialPlacement
                ? `Penyewa pertama kali ditempatkan di ${tenantData.currentPropertyName || ''} — ${tenantData.currentUnitName}.`
                : `Dipindahkan dari ${t.currentUnitName} ke ${tenantData.currentPropertyName || ''} — ${tenantData.currentUnitName}.`,
              propertyName: tenantData.currentPropertyName,
              unitName: tenantData.currentUnitName,
              timestamp: new Date().toISOString(),
            });
          }

          // Free unit if previously active and now changed to NONAKTIF
          if (t.status === 'AKTIF' && newStatus === 'NONAKTIF' && t.currentUnitName) {
            try {
              const storedUnits = localStorage.getItem('arventa_units');
              if (storedUnits) {
                const unitsList = JSON.parse(storedUnits);
                const updatedUnits = unitsList.map((u: any) => {
                  if (u.name === t.currentUnitName || u.unitNumber === t.currentUnitName) {
                    return {
                      ...u,
                      status: 'Available',
                      tenantName: undefined,
                      checkInDate: undefined,
                    };
                  }
                  return u;
                });
                localStorage.setItem('arventa_units', JSON.stringify(updatedUnits));
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('storage'));
                }
              }
            } catch (e) {
              console.warn('Failed to update local unit availability:', e);
            }
          }

          const resObj = {
            ...t,
            ...tenantData,
            status: newStatus,
            history: newHistory,
          } as Tenant;
          updatedEditedTenant = resObj;
          return resObj;
        }
        return t;
      });
      saveTenantsLocally(updated);
      if (selectedTenant && selectedTenant.id === tenantData.id && updatedEditedTenant) {
        setSelectedTenant(updatedEditedTenant);
      }
      showToast('Data Penyewa Diperbarui', `Profil data penyewa ${tenantData.fullName || ''} berhasil diperbarui.`);
    } else {
      // Create new via API
      try {
        const res = await fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await fetchTenants();
          showToast('Penyewa Baru Berhasil Dibuat', `Profil data penyewa ${tenantData.fullName || ''} telah ditambahkan ke sistem.`);
          return;
        }
      } catch (err) {
        console.warn('API create notice: saving into local storage state', err);
      }

      const initialHistory: TenantHistoryRecord[] = [];
      const hasUnit = Boolean(tenantData.currentUnitName && tenantData.status === 'AKTIF');
      initialHistory.push({
        id: `hist-create-${Date.now()}`,
        type: hasUnit ? 'INITIAL_PLACEMENT' : 'REGISTERED',
        title: hasUnit
          ? `Penempatan Unit: ${tenantData.currentPropertyName || 'Properti'} — ${tenantData.currentUnitName}`
          : 'Pendaftaran Calon Penyewa Baru',
        description: hasUnit
          ? `Penyewa baru terdaftar dan ditempatkan pada unit ${tenantData.currentPropertyName || ''} — ${tenantData.currentUnitName}.`
          : 'Calon penyewa baru terdaftar di sistem (Belum ada penempatan unit).',
        propertyName: tenantData.currentPropertyName,
        unitName: tenantData.currentUnitName,
        toStatus: tenantData.status || 'CALON',
        timestamp: new Date().toISOString(),
      });

      // Local create
      const newTenant: Tenant = {
        id: `tenant-${Date.now()}`,
        fullName: tenantData.fullName || '',
        nik: tenantData.nik || '',
        email: tenantData.email || '',
        phoneNumber: tenantData.phoneNumber || '',
        occupation: tenantData.occupation || 'Wiraswasta',
        status: tenantData.status || 'CALON',
        ktpImageUrl: tenantData.ktpImageUrl,
        birthPlaceDate: tenantData.birthPlaceDate,
        gender: tenantData.gender,
        bloodType: tenantData.bloodType,
        addressKtp: tenantData.addressKtp,
        rtRw: tenantData.rtRw,
        kelDesa: tenantData.kelDesa,
        kecamatan: tenantData.kecamatan,
        religion: tenantData.religion,
        maritalStatus: tenantData.maritalStatus,
        nationality: tenantData.nationality,
        validUntil: tenantData.validUntil,
        emergencyContact: tenantData.emergencyContact,
        currentPropertyName: tenantData.currentPropertyName,
        currentUnitName: tenantData.currentUnitName,
        history: initialHistory.length > 0 ? initialHistory : undefined,
        notes: tenantData.notes,
        createdAt: new Date().toISOString(),
      };
      saveTenantsLocally([newTenant, ...tenants]);
      showToast('Penyewa Baru Berhasil Dibuat', `Profil data penyewa ${tenantData.fullName || ''} telah ditambahkan ke sistem.`);
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!id || isDeleting) return;
    setIsDeleting(true);

    const targetTenant = tenants.find((t) => t.id === id);

    // Free unit occupancy locally if tenant is active & has unit
    if (targetTenant?.status === 'AKTIF' && targetTenant?.currentUnitName) {
      try {
        const storedUnits = localStorage.getItem('arventa_units');
        if (storedUnits) {
          const unitsList = JSON.parse(storedUnits);
          const updatedUnits = unitsList.map((u: any) => {
            if (u.name === targetTenant.currentUnitName || u.unitNumber === targetTenant.currentUnitName) {
              return {
                ...u,
                status: 'Available',
                tenantName: undefined,
                checkInDate: undefined,
              };
            }
            return u;
          });
          localStorage.setItem('arventa_units', JSON.stringify(updatedUnits));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (e) {
        console.warn('Failed to update unit availability on delete:', e);
      }
    }

    try {
      const res = await fetch(`/api/tenants/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchTenants();
        setTenantToDelete(null);
        setIsDeleting(false);
        showToast('Data Penyewa Dihapus', `Profil data penyewa ${targetTenant?.fullName || ''} berhasil dihapus dari database.`, 'info');
        return;
      }
    } catch (err) {
      console.warn('API delete notice: deleting from local storage state', err);
    }

    // Local delete fallback
    const updated = tenants.filter((t) => t.id !== id);
    saveTenantsLocally(updated);
    setTenantToDelete(null);
    setIsDeleting(false);
    showToast('Data Penyewa Dihapus', `Profil data penyewa ${targetTenant?.fullName || ''} berhasil dihapus.`, 'info');
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

        {/* Calon Penyewa */}
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Calon Penyewa</p>
            <h3 className="text-2xl font-black text-amber-800 mt-1">{metrics.calon}</h3>
            <p className="text-[11px] text-amber-600 mt-0.5">Terdaftar / Belum ada unit</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Clock className="h-6 w-6" />
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
              <option value="CALON">Calon Penyewa</option>
              <option value="AKTIF">Penyewa Aktif</option>
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
                        {/* Pindah Unit (Hanya untuk penyewa AKTIF yang sudah memiliki penempatan unit) */}
                        {tenant.status === 'AKTIF' && tenant.currentUnitName && (
                          <button
                            onClick={() => handleOpenTransferModal(tenant)}
                            title="Pindah / Atur Penempatan Unit"
                            className="rounded-xl p-2 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                        )}

                        {/* Buat Kontrak (Shortcut khusus untuk Calon Penyewa) */}
                        {tenant.status === 'CALON' && (
                          <a
                            href={`/tenant-contract?createForTenantId=${tenant.id}`}
                            title="Terbitkan Kontrak Sewa untuk Calon Penyewa Ini"
                            className="rounded-xl p-2 text-amber-600 hover:bg-amber-100/60 transition-all flex items-center gap-1 font-bold text-xs"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="hidden md:inline">Terbitkan Kontrak</span>
                          </a>
                        )}

                        {/* Lihat Kontrak (Hanya untuk penyewa aktif yang memiliki unit) */}
                        {tenant.status === 'AKTIF' && tenant.currentUnitName && (
                          <button
                            onClick={() => handleViewContract(tenant)}
                            title="Lihat Surat Perjanjian Kontrak Sewa"
                            className="rounded-xl p-2 text-gray-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}

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
        onViewContract={handleViewContract}
      />

      {/* Contract Preview Modal */}
      <ContractPreviewModal
        isOpen={isPreviewContractOpen}
        onClose={() => setIsPreviewContractOpen(false)}
        contract={selectedContractForPreview}
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
              <p className="text-xs text-gray-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus data penyewa <span className="font-bold text-gray-800">{tenantToDelete.fullName}</span>? Tindakan ini tidak dapat dikembalikan.
              </p>
              {tenantToDelete.status === 'AKTIF' && tenantToDelete.currentUnitName && (
                <div className="mt-2.5 rounded-xl bg-amber-50 p-3 border border-amber-200/80 text-[11px] text-amber-800 font-medium flex items-start gap-2 text-left">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Penyewa ini saat ini menempati unit <strong>{tenantToDelete.currentUnitName}</strong>. Menghapus data ini juga akan mengosongkan status unit tersebut.
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setTenantToDelete(null)}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Batal
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDeleteTenant(tenantToDelete.id)}
                className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses Hapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed top-6 right-6 z-[9999] max-w-md w-full animate-in slide-in-from-top-6 fade-in duration-300 pointer-events-auto">
          <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-2xl border border-emerald-100/90 flex items-start gap-3.5 ring-1 ring-black/5">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${toastNotification.type === 'info'
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/30'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-600/30'
              }`}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex-1 pr-6">
              <h4 className="text-xs font-bold text-gray-900 tracking-tight">{toastNotification.title}</h4>
              <p className="text-[11px] text-gray-600 font-medium leading-relaxed mt-0.5">{toastNotification.message}</p>
            </div>
            <button
              onClick={() => setToastNotification(null)}
              className="absolute top-3.5 right-3.5 rounded-xl p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Subtle Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-100/80 overflow-hidden">
              <div className="h-full bg-emerald-500 animate-[shrink_4.5s_linear_forwards]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TenantsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-semibold text-gray-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Memuat data penyewa...</span>
        </div>
      }
    >
      <TenantsPageContent />
    </Suspense>
  );
}
